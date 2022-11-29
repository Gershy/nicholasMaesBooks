let [ http, https, fs, path ] = [ 'http', 'https', 'fs', 'path' ].map(require);
let fsp = fs.promises;

let createProtocolServer = {
  http: async (host, port, fn) => {
    let server = http.createServer(fn);
    server.listen(port, host);
  },
  https: async (host, port, fn) => {
    
    if (port !== 443) throw new Error('Server must use port 443 for https');
    
    let certDir = args?.httpsCertPath ?? null;
    if (certDir?.constructor === String) certDir = certDir.split(',');
    if (certDir?.constructor !== Array) throw new Error(`Array "httpsCertPath" is required for https server`);
    
    let destroyableServer = server => {
      
      let sockets = new Set();
      server.on('connection', socket => {
        sockets.add(socket);
        socket.once('close', () => sockets.delete(socket));
      });
      server.destroy = () => {
        console.log(`Destroying ${sockets.size} socket(s) for ${server.constructor.name}`);
        for (let socket of sockets) socket.destroy();
        sockets.clear();
        return new Promise((rsv, rjc) => server.close(err => err ? rjc(err) : rsv()));
      };
      return server;
      
    };
    let initHttpsServer = async () => {
      
      // TLS server on given port (probably 443)
      let [ key, cert ] = await Promise.all([
        fsp.readFile(path.join(...certDir, 'privkey.pem')),
        fsp.readFile(path.join(...certDir, 'fullchain.pem'))
      ]);
      
      let server = destroyableServer(https.createServer({ key, cert }, fn));
      
      server.listen(port, host);
      await new Promise((rsv, rjc) => { server.on('listening', rsv); server.on('error', rjc); });
      
      return server;
      
    };
    let initHttpServer = async () => {
      
      // Http simply redirects to http
      let server = destroyableServer(http.createServer((req, res) => {
        res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
        res.end();
      }));
      
      server.listen(80, host);
      await new Promise((rsv, rjc) => { server.on('listening', rsv); server.on('error', rjc); });
      
      return server;
      
    };
    
    let [ httpsServer, httpServer ] = await Promise.all([ initHttpsServer(), initHttpServer() ]);
    
    // Cert renewal loop:
    let certRenewalDelayMs = args?.certRenewalDelayMs ?? 12 * 60 * 60 * 1000; // 12hrs
    let delay = (args?.renewImmediately ?? false) ? 500 : certRenewalDelayMs;
    (async () => {
      
      console.log('Cert renewal loop active');
      let certRenewLog = str => console.log(str.replace(/\r/g, '').split('\n').map(ln => `CERT: ${ln}`).join('\n'));
      
      while (true) {
        
        await new Promise(r => setTimeout(r, delay));
        delay = certRenewalDelayMs;
        
        certRenewLog('Performing cert renewal...');
        
        // The renewal process is:
        // 1. Release ports 443 and 80 (certbot needs these ports)
        // 2. Run certbot script
        // 3. Resume listening on these ports
        
        try {
          
          // Step 1
          certRenewLog('Freeing ports 80 and 443...');
          
          let closePromise = Promise.all([ httpServer, httpsServer ].map(server => server.destroy()));
          [ httpServer, httpsServer ] = [ null, null ];
          certRenewLog('Freed!');
          
          // Step 2
          certRenewLog('Running certbot script...');
          let certbotPrc = require('child_process').spawn('certbot', [ 'renew' ]);
          let stdout = [];
          let stderr = [];
          certbotPrc.stdout.on('data', data => stdout.push(data));
          certbotPrc.stderr.on('data', data => stderr.push(data));
          let exitCode = await new Promise((rsv, rjc) => certbotPrc.on('close', rsv) + certbotPrc.on('error', rjc));
          
          // Show certbot output
          [ stdout, stderr ] = [ stdout, stderr ].map(arr => Buffer.concat(arr).toString('utf8').split('\n').map(ln => '>>  ' + ln).join('\n'));
          if (stdout) console.log(`Certbot stdout:\n${stdout}`);
          if (stderr) console.log(`Certbot stderr:\n${stderr}`);
          
          if (exitCode !== 0) throw new Error(`Certbot process had exit-code ${exitCode}`);
          certRenewLog('Certbot script complete!');
          
        } finally {
          
          // Step 3
          try {
            
            // Ensure servers restart successfully (ideally trigger alert
            // if this fails)
            certRenewLog('Restarting servers...');
            [ httpsServer, httpServer ] = await Promise.all([ initHttpsServer(), initHttpServer() ]);
            certRenewLog('Servers restarted successfully!');
            
          } catch(err) {
            
            certRenewLog(`Fatal error; unable to restart servers`, err.stack);
            process.exit(0);
            
          }
          
        }
        
        certRenewLog('Cert renewal success!');
        
      }
      
    })()
      .catch(err => console.log('Cert renewal failed (renewal loop exited)', err.stack));
    
  }
};

(async () => {
  
  let argv = process.argv[2] || 'http://localhost:80';
  let [ hosting, ...more ] = argv.split(' ');
  
  let protocol=null;
  let host = null;
  let port = null;
  
  port = parseInt(port, 10);
  
  // Initialize args
  let args = {};
  
  // Add args from args.json
  try         { args = JSON.parse(await fsp.readFile(path.join(__dirname, 'args.json'))); }
  catch (err) { console.log(`No arguments defined in args.js`); }
  
  // Add "more" args
  if (more.length) args = { ...args, ...eval(`(${more.join(' ')})`) };
  
  // Parse "hosting" args
  if (hosting) {
    let [ , protocol, host, port ] = hosting.match(/^([^:]+):[/][/]([^:]+)[:]([0-9]+)$/) ?? [];
    args = { ...args, protocol, host, port };
  }
  
  // Done parsing args!
  console.log('Params:', args);
  
  let { protocol, host, port } = args;
  if (!createProtocolServer.hasOwnProperty(protocol)) throw new Error(`Invalid protocol: ${protocol}`);
  
  // Send response
  let serve = (res, status, content, type) => {
    
    let isStream = content instanceof fs.ReadStream;
    
    let headers = {
      'Content-Type': type,
      ...(isStream ? {} : { 'Content-Length': Buffer.byteLength(content) }), // Cache for 1 day
      'Cache-Control': `max-age=${5 * 24 * 60 * 60}`
    };
    res.writeHead(status, headers);
    
    if (isStream) content.pipe(res);
    else          res.end(content);
    
  };
  
  // Read (potentially cached) file
  let cacheMs = 2000;
  let fileCache = new Map();
  let readFile = (...fp) => {
    fp = path.join(...fp);
    if (!fileCache.has(fp)) {
      fileCache.set(fp, fsp.readFile(path.join(__dirname, fp)));
      setTimeout(() => fileCache.delete(fp), cacheMs);
    }
    return fileCache.get(fp);
  };
  
  let assets = null;
  await createProtocolServer[protocol](host, port, async (req, res) => {
    
    let reqMsg = [];
    let addReqMsg = ln => reqMsg.push(...ln.split('\n'));
    let serveReq = (res, status, content, type) => {
      console.log(`${req.connection.remoteAddress} <- ${req.url}${reqMsg.length ? ':' : ''}`);
      if (reqMsg.length) console.log(reqMsg.map(ln => `> ${ln}`).join('\n'));
      serve(res, status, content, type);
    };
    
    try {
      
      // Current content of assets.json stays valid for 1min
      if (assets === null) {
        
        assets = Object.fromEntries(
          Object.entries(JSON.parse(await readFile('asset', 'assets.json'))).map(([ key, val ]) => {
            if (val?.constructor !== Array) {
              let [ mime, path ] = val.split(/[ ]+/);
              return [ key, [ mime, ...path.split('/') ] ];
            }
          })
        );
        
        setTimeout(() => assets = null, 10 * 60 * 1000); // 10min
        
      }
      
      let assetName = req.url.slice(1);
      let [ contentType=null, ...fp ] = assets.hasOwnProperty(assetName) ? assets[assetName] : [];
      if (!contentType) throw new Error(`Unknown asset: ${req.url}`);
      
      let readStream = fs.createReadStream(path.join(__dirname, ...fp));
      serveReq(res, 200, readStream, contentType);
      
    } catch(err) {
      
      addReqMsg(`Error occurred: ${err.stack}`);
      serveReq(res, 400, 'Your request is as invalid as the assertion that chicken is fleishig', 'text/plain');
      
    }
    
  });
  console.log(`Listening on ${protocol}://${host}:${port}`);
  
})();
