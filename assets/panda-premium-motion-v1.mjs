// Opt-in motion hooks; no listeners, navigation changes, or persistent CSS.
// Integrate only into approved controls, never the fixed header/footer containers.
function motionPlan(kind,{reduced=false}={}){
 const presets={
  press:{duration:120,keyframes:[{opacity:1,transform:"translateY(0)"},{opacity:.92,transform:"translateY(1px)"}]},
  release:{duration:180,keyframes:[{opacity:.92,transform:"translateY(1px)"},{opacity:1,transform:"translateY(0)"}]},
  step:{duration:220,keyframes:[{opacity:.55},{opacity:1}]},
  complete:{duration:460,keyframes:[{opacity:.65,transform:"scale(.97)"},{opacity:1,transform:"scale(1)"}]}
 };
 if(!Object.hasOwn(presets,kind))throw new RangeError("Unknown motion");
 return reduced?{duration:0,keyframes:[presets[kind].keyframes.at(-1)]}:presets[kind];
}
function createPremiumMotion({reduced=()=>globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches===true}={}){
 const running=new Map(),completed=new WeakSet();
 function stop(el){const old=running.get(el);if(old){old.cancel();running.delete(el);}}
 function play(el,kind){
  if(!el||typeof el.animate!=="function")return false;
  stop(el);
  const plan=motionPlan(kind,{reduced:reduced()});
  if(!plan.duration)return false;
  const animation=el.animate(plan.keyframes,{duration:plan.duration,easing:"cubic-bezier(.2,.65,.3,1)",fill:"none"});
  running.set(el,animation);
  const cleanup=()=>{if(running.get(el)===animation)running.delete(el);};
  animation.addEventListener("finish",cleanup,{once:true});animation.addEventListener("cancel",cleanup,{once:true});
  return true;
 }
 return {press:el=>play(el,"press"),release:el=>play(el,"release"),step:el=>play(el,"step"),complete(el,{confirmed=false}={}){if(!confirmed||!el||completed.has(el))return false;completed.add(el);return play(el,"complete");},stop,reset(){for(const el of [...running.keys()])stop(el);}};
}
export {motionPlan,createPremiumMotion};
