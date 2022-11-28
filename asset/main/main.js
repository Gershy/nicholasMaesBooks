let style = (elem, prop, val) => (elem.style[prop] !== val) && (elem.style[prop] = val);

window.addEventListener('load', () => {
  
  let maxSize = 120;
  let items = [
    { ind: '00', elem: null, calcW: null, size: 110, top: 55, text: 'Locks. They were scattered across the table. Some were very run-of-the-mill – the padlock, combination lock, surface auxiliary and pin tumbler cylinders. Then there were the others: the titanium "gridiron" for high-security prisons, the convex "strangulator" for an F-18 fighter plane, the phantom hyperlink that was said to be unbreakable...' },
    { ind: '01', elem: null, calcW: null, size:  88, top: 41, text: '"I\'m telling you, I\'ll build an unbreakable lock. You\'ll see!"' },
    { ind: '02', elem: null, calcW: null, size:  23, top:  7, text: 'He approached a staircase that led to the basement. At the head of these stairs stood a squat wooden column whose top had been fitted with a strip of glass. The glass was blue and was tilted at a sixty degree angle. Holding his hand to the glass, Lewis smiled as a sensor scanned his handprint and caused a bolt on the downstairs door to open, at which stage several lights in the stairwell flickered on. He descended the steps two at a time. By the time he reached the bottom, the basement door had opened and the well-lit space beyond was visible. As he crossed the threshold, he felt his worries lift.' },
    { ind: '03', elem: null, calcW: null, size:  67, top: 90, text: 'Next to Crassus was the building\'s owner. As tenants on the upper floors pleased to be rescued, and a crowd gathered to watch the drama, and pedestrians cursed because the street was blocked, he turned to Crassus and tugged at the great man\'s toga. "I\'ll sell it for a million denarii and not a sestertius less."' },
    { ind: '04', elem: null, calcW: null, size:  18, top: 71, text: 'He glanced at his reflection in a Teledata screen. A serious-looking face stared back, its eyes blue-green and brimming with confusion, the nose long and bony (exactly like his father\'s), the hair straw-coloured, and the chin sharp and dimpled. With a grunt of impatience he engaged the screen and murmured, "External monitor."' },
    { ind: '05', elem: null, calcW: null, size:  73, top: 36, text: '"Honoured passengers," a voice announced, "Inter-City Services regrets to inform you that Shuttle 997, from Rome to Toronto, is experiencing a medical crisis on board. A Medevac will be docking in fifty seconds and will convey the affected passenger to the nearest Health Facility. Service is expected to resume momentarily. All g-force pods have been hermetically sealed and will disengage on the completion of our disinfectant protocols. We apologize for the inconvenience and appreciate your patience."' },
    { ind: '06', elem: null, calcW: null, size:  55, top: 29, text: '"What are Greek and Latin?" "They\'re languages that were spoken in ancient times." "You mean, before everyone learned Common Speak?"' },
    { ind: '07', elem: null, calcW: null, size:  50, top: 95, text: '"That\'s for sure. If he could, he\'d stop all weather regulation, protein synthesis, retinal upgrades, synapse modification, ERR, genetic transference..."' },
    { ind: '08', elem: null, calcW: null, size: 100, top: 12, text: 'Felix stepped into the field. In the instant it took his Athens to be scrambled, dispatched across the city and reconfigured in the Portal outside his home, he just had time to register the thought that something was askew in their carefully ordered world.' },
    { ind: '09', elem: null, calcW: null, size:  60, top: 16, text: 'Even as he trembled slightly, Simon did feel sorry for this stranger. He glanced up and down the shelves, desperate to help the poor guy out. Slowly a realization dawned: no one else noticed the shouting. The staff and customers weren\'t batting an eye, as if it were normal for someone to be shrieking like that.' },
    { ind: '10', elem: null, calcW: null, size:  41, top: 88, text: '"It ain\'t no trick!" the voice continued. The rabbit had its paws against the lid, in what seemed to be a show of desperation. "But you ain\'t answered me! How come you can hear me? Who de hell are you?"' },
    { ind: '11', elem: null, calcW: null, size:  88, top: 79, text: '"You were probably dreaming," he told himself as he and Ian started running down the sidewalk... But it was no dream. Either that rabbit had spoken or, like Winston said, he was totally nuts.' },
    { ind: '12', elem: null, calcW: null, size:  85, top: 21, text: '"There was an incident by the wall," Dror spoke. A muscular guy, he was dressed in jeans and a t-shirt stamped with the smiling image of Bob Marley. He was warm and friendly and spoke with self-assurance, as if he knew better than everyone else – a typical Israeli. "They say a couple of shots were fired."' },
    { ind: '13', elem: null, calcW: null, size:  23, top: 67, text: '"Honoured passengers," a voice broke in, "InterCity Services is pleased to inform you that Global President Siegfried Angstrom will be addressing the world in precisely five minutes. Please stay tuned for this important broadcast."' },
    { ind: '14', elem: null, calcW: null, size:  96, top:  4, text: 'As abruptly as it had failed, the power returned. The engine was humming, the lights flicked on and the craft swiftly straightened itself. Every screen was back online and a voice was explaining that the ship was fine and InterCity Services regretted the outage.' },
    { ind: '15', elem: null, calcW: null, size:  29, top: 24, text: 'Does anyone know I\'m floating in a pool? In the neurology textbooks the doctors consult, is it mentioned that memories can be turned to water? It would comfort Sue greatly if she knew my situation, and Pete might suppress that constipated look.' }
  ];
  
  let textStreamsContainerElem = document.getElementById('text-streams');
  
  let recalcStreams = () => {
    
    let containerW = textStreamsContainerElem.getBoundingClientRect().width;
    for (let item of items) {
      
      if (!item.elem) {
        
        let { ind, size, top, text } = item;
        let elem = item.elem = document.createElement('div');
        textStreamsContainerElem.appendChild(elem);
        
        elem.classList.add('text-stream');
        
        let sizePx = `${size}px`;
        Object.assign(elem.style, {
          fontSize: sizePx,
          height: sizePx, lineHeight: sizePx,
          marginTop: `-${size >> 1}px`,
          opacity: 0.07 + (maxSize - size) / maxSize * 0.60,
          zIndex: maxSize - size,
          top: `${top}%`
        });
        
        elem.innerHTML = `${text} `;
        item.calcW = elem.getBoundingClientRect().width;
        
        let keyframeStyle = document.createElement('style');
        document.head.appendChild(keyframeStyle);
        keyframeStyle.setAttribute('type', 'text/css');
        keyframeStyle.innerHTML = `@keyframes anim-${ind} { 0% { left: 0px; } 100% { left: -${Math.round(item.calcW)}px; } }`;
        
        elem.style.animation = `anim-${ind} ${Math.round(item.calcW) * Math.pow(size, 0.5) / 100}s infinite linear`;
        
      }
      
      let { elem, calcW, text } = item;
      elem.innerHTML = `${text} `.repeat(Math.ceil(containerW / calcW) + 1);
      
    }
    
  };
  
  window.addEventListener('resize', recalcStreams);
  recalcStreams();
  
  let containerElem = document.getElementById('container');
  let mainElem = document.getElementById('main');
  
  let oldTop = containerElem.scrollTop;
  let navElem = containerElem.querySelector('.nav');
  let anim = () => {
    
    let { width, height } = containerElem.getBoundingClientRect();
    let { height: targetDist } = mainElem.getBoundingClientRect();
    let viewT = containerElem.scrollTop;
    
    targetDist -= 220;
    if ((viewT < targetDist) !== navElem.classList.contains('hidden')) navElem.classList.toggle('hidden');
    
    //if (viewT < targetBottom  && !navElem.classList.contains('hidden')) navElem.classList.add('hidden');
    //if (viewT >= targetBottom &&  navElem.classList.contains('hidden')) navElem.classList.remove('hidden');
    
    //navElem.style.top = `${viewB - 50}px`;
    
    requestAnimationFrame(anim);
    
  };
  anim();
  
});
