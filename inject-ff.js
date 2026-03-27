// Gringozin FF Aim Injector - Bookmarklet/Console
// Drag to bookmarks or paste in FF console + Enter

javascript:(function(){
  if (window.engine) {
    window.engine.toggleVisibility();
    alert('✅ Aim Assist toggled!');
    return;
  }
  
  const s = document.createElement('script');
  s.src = prompt('PWA URL (ex: http://localhost:8080/enginebundle.js):', 'http://localhost:8080/enginebundle.js');
  s.crossOrigin = 'anonymous';
  s.onload = () => {
    if (window.engine) {
      window.engine.toggleVisibility();
      console.log('✅ Gringozin Aim injected!');
      alert('✅ Aim Assist injetado!');
    } else {
      alert('❌ Engine load failed');
    }
  };
  s.onerror = () => alert('❌ Failed to load engine');
  document.head.appendChild(s);
  
  // Add status overlay
  const status = document.createElement('div');
  status.id = 'gringozin-status';
  status.style.cssText = 'position:fixed;top:10px;left:10px;z-index:99999;background:rgba(0,0,0,0.8);color:lime;font:14px monospace;padding:10px;border-radius:5px;pointer-events:none';
  status.textContent = 'Gringozin FF Aim Loading...';
  document.body.appendChild(status);
  
  setTimeout(() => {
    const st = document.getElementById('gringozin-status');
    if (st) st.textContent = window.engine ? 'Aim ATIVA' : 'Load failed';
  }, 2000);
})();

