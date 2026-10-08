function toast(msg){
  const t=document.getElementById('toast');
  if(!t)return;
  t.textContent=msg;
  t.classList.add('show');
  clearTimeout(window.__t);
  window.__t=setTimeout(()=>t.classList.remove('show'),2300);
}

const OPEN_CHAT_URL = "https://open.kakao.com/me/Xiabook";

// FAQ buttons only open/close the FAQ item.
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.faq-list button').forEach(b=>{
    b.addEventListener('click',()=>b.classList.toggle('open'));
  });
});

// ONLY buttons labeled '결제하기' go to Kakao Open Chat.
document.addEventListener('click',(e)=>{
  const btn=e.target.closest('button');
  if(!btn) return;
  const label=(btn.innerText||btn.textContent||'').replace(/\s+/g,'').trim();
  if(label.includes('결제하기')){
    e.preventDefault();
    window.location.href=OPEN_CHAT_URL;
  }
});

function getReferralCode(){
  let code=localStorage.getItem('nexus_ref_owner');
  if(!code){
    code='NEXUS-'+Math.random().toString(36).slice(2,7).toUpperCase();
    localStorage.setItem('nexus_ref_owner',code);
  }
  return code;
}
function getReferralUrl(){
  return location.origin + '/?ref=' + encodeURIComponent(getReferralCode());
}
function updateReferralLink(){
  const code=getReferralCode();
  const url=getReferralUrl();
  const link=document.getElementById('nexus-ref-link');
  const label=document.getElementById('nexus-ref-code-label');
  if(link){link.href=url;link.textContent=url;}
  if(label){label.textContent='추천인 코드: '+code;}
}
function copyReferralLink(){
  const url=getReferralUrl();
  const done=()=>toast('추천 링크가 복사되었습니다. 친구에게 보내세요.');
  if(navigator.clipboard){navigator.clipboard.writeText(url).then(done).catch(()=>window.prompt('추천 링크를 복사하세요.',url));}
  else window.prompt('추천 링크를 복사하세요.',url);
}


document.addEventListener('DOMContentLoaded', updateReferralLink);


// NEXUS referral tracking: ?ref=CODE is stored and sent to the server.
(function(){
  async function trackReferral(){
    const ref = new URLSearchParams(location.search).get('ref');
    if (!ref) return;
    const code = ref.replace(/[^A-Za-z0-9_-]/g,'').slice(0,30);
    if (!code) return;
    localStorage.setItem('nexus_referral_code', code);
    try {
      await fetch('/api/referral/visit', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({code})
      });
    } catch(e) {}
  }
  window.NEXUS_REFERRAL = {
    getCode: () => localStorage.getItem('nexus_referral_code') || '',
    getLink: () => {
      const c = localStorage.getItem('nexus_referral_code') || '';
      return c ? location.origin + '/?ref=' + encodeURIComponent(c) : '';
    }
  };
  document.addEventListener('DOMContentLoaded', trackReferral);
})();
