/* Panda Go HSK 1 translation guard v503.
 * Preserve Hanzi and Pinyin when supported automatic translators process Russian instructions.
 * Deliberately leave Russian teaching text translatable; this does not disable WeChat translation.
 * Adds only language/translate metadata and inline spans; no styles or lesson state changes.
 */
(()=>{
  'use strict';
  const HAN=/[\u3400-\u9fff\uf900-\ufaff]/u;
  const CYR=/[\u0400-\u052f]/u;
  const TONES=/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙǕǗǙǛ]/u;
  const SPLIT=/[\u3400-\u9fff\uf900-\ufaff]+|[A-Za-zÜüĀ-ǜ]+/gu;
  const OMIT='script,style,noscript,textarea,select,option,svg,math,code,pre';
  function protectedAncestor(el){
    return !!el.closest('[translate="no"],.notranslate');
  }
  function protect(el,lang){
    if(el.getAttribute('translate')!=='no')el.setAttribute('translate','no');
    if(!el.classList.contains('notranslate'))el.classList.add('notranslate');
    if(!el.hasAttribute('lang'))el.setAttribute('lang',lang);
  }
  function isPinyinClass(el){
    return [...el.classList].some(c=>/(^|[-_])(?:pinyin|py)(?:$|[-_])/i.test(c));
  }
  function protectElement(el){
    if(el.closest(OMIT)||protectedAncestor(el))return;
    const value=(el.textContent||'').trim();
    if(!value)return;
    if((el.getAttribute('lang')||'').toLowerCase().startsWith('zh')&&!CYR.test(value)){
      protect(el,'zh-Hans');return;
    }
    if(isPinyinClass(el)&&!CYR.test(value)){
      protect(el,'zh-Latn-pinyin');return;
    }
    // Only mark a whole element if its sole text node is a Chinese/Pinyin value.
    // Keep mixed Russian explanations separately translatable.
    if(el.childNodes.length===1&&el.firstChild.nodeType===3&&!CYR.test(value)){
      if(HAN.test(value)){protect(el,'zh-Hans');return;}
      if(TONES.test(value)){protect(el,'zh-Latn-pinyin');}
    }
  }
  function protectText(node){
    const el=node.parentElement;
    if(!el||!node.isConnected||el.closest(OMIT)||protectedAncestor(el))return;
    const original=node.nodeValue||'';
    if(!HAN.test(original)&&!TONES.test(original))return;
    const pieces=[],matches=[...original.matchAll(SPLIT)];
    let cursor=0,changed=false;
    for(const match of matches){
      const part=match[0],start=match.index;
      const chinese=HAN.test(part),pinyin=!chinese&&TONES.test(part);
      if(!chinese&&!pinyin)continue;
      if(start>cursor)pieces.push(document.createTextNode(original.slice(cursor,start)));
      const span=document.createElement('span');
      span.textContent=part;
      protect(span,chinese?'zh-Hans':'zh-Latn-pinyin');
      pieces.push(span);
      cursor=start+part.length;
      changed=true;
    }
    if(!changed)return;
    if(cursor<original.length)pieces.push(document.createTextNode(original.slice(cursor)));
    const fragment=document.createDocumentFragment();
    for(const item of pieces)fragment.appendChild(item);
    node.replaceWith(fragment);
  }
  function scan(root){
    if(!root||root.nodeType!==1)return;
    const elements=[root,...root.querySelectorAll('*')];
    for(const el of elements)protectElement(el);
    const nodes=[];
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    for(let n=walker.nextNode();n;n=walker.nextNode())nodes.push(n);
    for(const node of nodes)protectText(node);
  }
  function start(){
    const root=document.querySelector('main');
    if(!root)return;
    scan(root);
    const observer=new MutationObserver(records=>{
      const newElements=new Set(),newText=[];
      for(const record of records){
        if(record.type!=='childList')continue;
        for(const node of record.addedNodes){
          if(node.nodeType===1)newElements.add(node);
          else if(node.nodeType===3)newText.push(node);
        }
      }
      for(const el of newElements)if(el.isConnected)scan(el);
      for(const node of newText)protectText(node);
    });
    observer.observe(root,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
