const OPSNORA_LICENSE_DEFAULT={dashboard:true,costing_bundle:true,costing_unit:false,orders:false,work:false,products:true,automations:false,users:false,reports:false,settings:false};
const OPSNORA_LICENSE_LABELS={dashboard:'Dashboard',costing_bundle:'Bundle Wise Costing',costing_unit:'Unit Wise Costing',orders:'Order Tracking',work:'Work Assign',products:'Products / Items',automations:'Automations',users:'User Management',reports:'Reports',settings:'Settings'};
const opsnoraLicense=()=>{let x=JSON.parse(localStorage.getItem('opsnoraLicense')||'null');if(!x){x={...OPSNORA_LICENSE_DEFAULT};localStorage.setItem('opsnoraLicense',JSON.stringify(x))}return x};
function licenseLockCard(feature){return `<div class="license-lock-card"><button type="button" class="license-lock-close" aria-label="Close">×</button><div class="license-lock-icon">🔒</div><h2>Not Available in Current Plan</h2><p class="muted">${OPSNORA_LICENSE_LABELS[feature]||'This feature'} is not available in the current plan.</p><small>Contact OPSNORA Team to enable access.</small></div>`}
function closeLicenseOverlay(overlay, fallback){
  if(!overlay)return;
  const root=overlay.closest('#pageRoot');
  overlay.remove();
  if(root)root.classList.remove('license-page-locked');
  if(fallback)fallback();
}
function wireLicenseOverlay(overlay, fallback){
  if(!overlay)return;
  const close=()=>closeLicenseOverlay(overlay,fallback);
  overlay.querySelector('.license-lock-close')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();close()});
  overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
}
function addPageLicenseOverlay(feature){
  const root=document.querySelector('#pageRoot');
  if(!root||root.querySelector('.license-page-overlay'))return;
  root.classList.add('license-page-locked');
  root.insertAdjacentHTML('beforeend',`<div class="license-page-overlay" aria-label="${OPSNORA_LICENSE_LABELS[feature]||'Feature'} unavailable">${licenseLockCard(feature)}</div>`);
  wireLicenseOverlay(root.querySelector('.license-page-overlay'),()=>history.back());
}
function addSubLicenseOverlay(el,feature){
  if(!el)return;
  el.classList.remove('hide');
  el.classList.add('license-sublocked');
  el.querySelector('.license-sub-overlay')?.remove();
  el.insertAdjacentHTML('beforeend',`<div class="license-sub-overlay">${licenseLockCard(feature)}</div>`);
  const overlay=el.querySelector('.license-sub-overlay');
  wireLicenseOverlay(overlay,()=>{
    document.querySelector('[data-mode="bundle"]')?.click();
  });
}
function applyLicenseGuards(){
  const page=pathPage(),l=opsnoraLicense();
  if(page==='main-admin'||page==='index')return;
  const feature=page==='costing'?'costing_bundle':page;
  if(l[feature]===false)addPageLicenseOverlay(feature);
  if(page==='costing'){
    const unitTab=document.querySelector('[data-mode="unit"]'),unitFields=document.querySelector('#unitFields');
    if(l.costing_unit===false&&unitTab){
      unitTab.classList.add('license-locked-tab');
      unitTab.onclick=e=>{
        e.preventDefault();e.stopImmediatePropagation();
        document.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('on',x===unitTab));
        document.querySelector('#bundleFields')?.classList.add('hide');
        addSubLicenseOverlay(unitFields,'costing_unit');
      };
    }
  }
}
function initMobileSidebar(){
  const side=document.querySelector('#side'),menu=document.querySelector('#menu');
  if(!side||!menu)return;
  let backdrop=document.querySelector('#sideBackdrop');
  if(!backdrop){backdrop=document.createElement('div');backdrop.id='sideBackdrop';backdrop.className='sideBackdrop';document.body.appendChild(backdrop)}
  const sync=()=>backdrop.classList.toggle('show',side.classList.contains('open'));
  menu.addEventListener('click',()=>{side.classList.toggle('open');sync()});
  backdrop.addEventListener('click',()=>{side.classList.remove('open');sync()});
  side.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{side.classList.remove('open');sync()}));
  document.querySelector('.main')?.addEventListener('click',e=>{if(e.target.closest('#menu'))return;if(side.classList.contains('open')){side.classList.remove('open');sync()}});
  window.addEventListener('resize',()=>{if(window.innerWidth>760){side.classList.remove('open');sync()}});
}

function initMainAdmin(){
  if(pathPage()!=='main-admin')return;
  const login=document.querySelector('#adminLoginView'),console=document.querySelector('#adminConsole');
  const showConsole=()=>{login?.classList.add('hide');console?.classList.remove('hide');initOwnerTabs();renderOwnerDashboard();renderLicenseAdmin();renderWaMaster()};
  if(sessionStorage.opsnoraMainAdmin==='1')showConsole();
  const form=document.querySelector('#mainAdminLogin');
  form?.addEventListener('submit',e=>{e.preventDefault();if(document.querySelector('#mainAdminUser').value==='owner@opsnora.com'&&document.querySelector('#mainAdminPass').value==='OPSNORA@2026'){sessionStorage.opsnoraMainAdmin='1';showConsole()}else document.querySelector('#mainAdminErr').textContent='Invalid owner credentials'});
  document.querySelector('#adminLogout')?.addEventListener('click',()=>{sessionStorage.removeItem('opsnoraMainAdmin');location.reload()});
  document.querySelector('#saveWaMaster')?.addEventListener('click',()=>{localStorage.setItem('opsnoraWaMaster',document.querySelector('#waMasterMessage')?.value||'');alert('WhatsApp master message saved')});
  document.querySelector('#openWaSettings')?.addEventListener('click',()=>{document.querySelector('#waSettingsPanel')?.classList.toggle('hide');document.querySelector('#waSettingsPanel')?.scrollIntoView({behavior:'smooth',block:'start'});renderWaMaster()});
  document.querySelectorAll('[data-ph]').forEach(x=>x.onclick=()=>{const ta=document.querySelector('#waMasterMessage');if(ta){const ph=x.dataset.ph;const s=ta.selectionStart||ta.value.length;ta.value=ta.value.slice(0,s)+ph+ta.value.slice(ta.selectionEnd||s);ta.focus();ta.selectionStart=ta.selectionEnd=s+ph.length}});
  document.querySelector('#resetLicense')?.addEventListener('click',()=>{localStorage.setItem('opsnoraLicense',JSON.stringify({...OPSNORA_LICENSE_DEFAULT}));renderLicenseAdmin();renderOwnerDashboard()})
}
function initOwnerTabs(){
  document.querySelectorAll('[data-owner-tab]').forEach(a=>a.onclick=e=>{e.preventDefault();const tab=a.dataset.ownerTab;document.querySelectorAll('[data-owner-tab]').forEach(x=>x.classList.toggle('active',x===a));document.querySelector('#ownerDashboard')?.classList.toggle('hide',tab!=='dashboard');document.querySelector('#ownerLicenses')?.classList.toggle('hide',tab!=='licenses');document.querySelector('#ownerData')?.classList.toggle('hide',tab!=='data');if(document.querySelector('#ownerTitle'))document.querySelector('#ownerTitle').textContent=tab==='dashboard'?'Usage Dashboard':tab==='licenses'?'Licenses & Plans':'Data Updation';if(tab==='dashboard')renderOwnerDashboard();if(tab==='licenses')renderLicenseAdmin();if(tab==='data')renderWaMaster()});
}
function renderLicenseAdmin(){const grid=document.querySelector('#licenseGrid');if(!grid)return;const l=opsnoraLicense();grid.innerHTML=Object.entries(OPSNORA_LICENSE_LABELS).map(([key,label])=>`<div class="licenseItem"><div><h3>${label}</h3><p class="muted">${key==='costing_unit'?'Allow unit-wise pricing and history.':key==='costing_bundle'?'Allow bundle-wise costing and history.':'Allow access to the '+label.toLowerCase()+' module.'}</p></div><button class="toggle ${l[key]?'on':''}" data-license="${key}" aria-label="Toggle ${label}" title="${l[key]?'Enabled':'Disabled'}"></button></div>`).join('');grid.querySelectorAll('[data-license]').forEach(b=>b.onclick=()=>{const x=opsnoraLicense();x[b.dataset.license]=!x[b.dataset.license];localStorage.setItem('opsnoraLicense',JSON.stringify(x));renderLicenseAdmin();renderOwnerDashboard()})}
function renderWaMaster(){const e=document.querySelector('#waMasterMessage');if(e)e.value=localStorage.getItem('opsnoraWaMaster')||'Hello,\n\nPlease find the costing details below:\nSize: {{Size}}\nLength: {{Length}}\nCost Price: {{Cost Price}}\nSelling Price: {{Selling Price}}\nProfit: {{Profit}}%\n\nThank you.';}

function renderOwnerDashboard(){
  const d=JSON.parse(localStorage.getItem('opsnoraCareData')||'null')||data;
  const usage=JSON.parse(localStorage.getItem('opsnoraUsage')||'{}');
  const bundle=(d.calculations||[]).length, unit=(d.unitCalculations||[]).length, calc=bundle+unit;
  const assigned=(d.tasks||[]).length, completed=(d.tasks||[]).filter(t=>t.status==='Completed').length;
  const whats=Number(usage.whatsappShares||0), value=Number(usage.sharedValue||0), l=opsnoraLicense();
  const set=(id,v)=>{const e=document.querySelector(id);if(e)e.textContent=v};
  set('#ouUsers',(d.users||[]).length);set('#ouCalc',calc);set('#ouBundle',bundle);set('#ouUnit',unit);set('#ouWhats',whats);set('#ouValue',money(value));set('#ouAssigned',assigned);set('#ouCompleted',completed);
  set('#ouBundle2',bundle);set('#ouUnit2',unit);set('#ouAssigned2',assigned);set('#ouCompleted2',completed);set('#ouWhats2',whats);
  const enabled=Object.values(l).filter(Boolean).length,locked=Object.values(l).filter(v=>!v).length;set('#ouLocked',locked);set('#ouEnabled',enabled);
  const mb=document.querySelector('#ownerPlanBadge'); if(mb) mb.textContent='ACTIVE';
}

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(+n||0);let data=JSON.parse(localStorage.getItem('opsnoraCareData')||'null')||structuredClone(defaults);data.users??=[{name:'Admin User',username:'admin@gmail.com',role:'Administrator',status:'Active',last:'Just now'}];data.tasks??=[];data.calculations??=[];data.unitCalculations??=[];data.orders.forEach(o=>o.history??=[]);const save=()=>{localStorage.setItem('opsnoraCareData',JSON.stringify(data));refresh()};
function pathPage(){return location.pathname.split('/').pop().replace('.html','')||'index'}
if(!['index','main-admin'].includes(pathPage())&&!sessionStorage.opsnoraCare){location.href='../index.html'}
function fillSizes(){const a=$('#size'),b=$('#quickSize');if(a)a.innerHTML=data.products.map(p=>`<option>${p.size}</option>`).join('');if(b)b.innerHTML=data.products.map(p=>`<option>${p.size}</option>`).join('')}
function selected(){return data.products.find(p=>p.size===$('#size')?.value)||data.products[0]}
function loadMaster(){const p=selected();if(!p)return;['wires','rule','rodRate','weight','pvcRate','labour'].forEach(k=>$('#'+k).value=p[k]??0);calculateBundle(false)}
function calculateBundle(saveIt){let wires=+$('#wires').value||0,rule=+$('#rule').value||0,rodRate=+$('#rodRate').value||0,weight=+$('#weight').value||0,pvcRate=+$('#pvcRate').value||0,labour=+$('#labour').value||0,profit=+$('#profit').value||0;let rod=rule*rodRate,pvc=weight*pvcRate,base=rod+pvc,labourCost=base*labour/100,cost100=base+labourCost,cost200=cost100*2,sp100=cost100*(1+profit/100),sp200=cost200*(1+profit/100);[['rodOut',rod],['pvcOut',pvc],['baseOut',base],['labourOut',labourCost],['bundle100',cost100],['bundle200',cost200],['sp100',sp100],['sp200',sp200]].forEach(([k,v])=>{if($('#'+k))$('#'+k).textContent=money(v)});if($('#unitCost'))$('#unitCost').value=cost200.toFixed(2);if(saveIt){data.calculations.unshift({time:new Date().toLocaleString('en-IN'),size:$('#size').value,wires,cost100,cost200,profit,sp100,sp200,rod,pvc,labourCost});save()}return{cost100,cost200,sp100,sp200}}
function calculateUnit(){let length=+$('#unitLength').value||1,cost=+$('#unitCost').value||0,mould=+$('#moulding').value||0,profit=+$('#unitProfit').value||0,base=cost/length+mould,pv=base*profit/100,sp=base+pv;if($('#unitBase'))$('#unitBase').textContent=money(cost/length);if($('#mouldOut'))$('#mouldOut').textContent=money(mould);if($('#unitProfitOut'))$('#unitProfitOut').textContent=money(pv);if($('#unitResult'))$('#unitResult').textContent=money(sp)}
function orderStatus(o){return o.received>=o.qty?'Completed':o.received>0?'Partial':'Pending'}
function taskStatusClass(s){return s==='Completed'?'completed':s==='Hold'?'hold':'pending'}
function refresh(){const page=pathPage();if(page==='dashboard'){fillSizes();$('#kc').textContent=data.calculations.length;$('#ko').textContent=data.orders.length;$('#kp').textContent=data.orders.filter(o=>o.received<o.qty).length;$('#ki').textContent=data.products.length;$('#recent').innerHTML=data.calculations.slice(0,5).map(c=>`<div class="lines"><div>${c.size} · 100m <b>${money(c.cost100)}</b></div></div>`).join('')||'<p class="muted">No calculations saved yet.</p>';let today=new Date().toISOString().slice(0,10),ts=data.tasks.filter(t=>t.due===today&&t.status!=='Completed');$('#todayBadge').textContent=ts.length;$('#todayTasks').innerHTML=ts.map(t=>`<div class="todayTask"><b>${t.title}</b><small>${t.assignee} · ${t.status}</small></div>`).join('')||'<p class="muted">No tasks due today.</p>';let vals=data.calculations.slice(0,6).reverse().map(x=>x.cost100),max=Math.max(...vals,1);$('#activityChart').innerHTML=(vals.length?vals:[0]).map((v,i)=>`<div class="chartBar" style="height:${Math.max(8,v/max*120)}px"><span>${i+1}</span></div>`).join('');quick()}if(page==='costing'){fillSizes();$('#calcTable').innerHTML=data.calculations.map(c=>`<tr><td>${c.time}</td><td>${c.size}</td><td>${c.wires}</td><td>${money(c.cost100)}</td><td>${money(c.cost200)}</td><td>${c.profit}%</td><td>${money(c.sp100)}</td><td>${money(c.sp200)}</td></tr>`).join('')||'<tr><td colspan="8">No calculations saved yet.</td></tr>';}if(page==='orders')$('#ordersTable').innerHTML=data.orders.map(o=>`<tr><td>${o.id}</td><td>${o.dealer}</td><td>${o.item}</td><td>${o.qty}</td><td>${money(o.rate)}</td><td>${o.received}</td><td>${o.qty-o.received}</td><td><span class="status ${orderStatus(o)==='Completed'?'completed':orderStatus(o)==='Partial'?'partial':'pending'}">${orderStatus(o)}</span></td></tr>`).join('');if(page==='work')renderTasks();if(page==='products')renderProducts();if(page==='users')$('#usersTable').innerHTML=data.users.map(u=>`<tr><td>${u.name}</td><td>${u.username}</td><td>${u.role}</td><td>${u.status}</td><td>${u.last}</td></tr>`).join('');if(page==='reports'){ $('#rc').textContent=data.calculations.length;$('#ro').textContent=data.orders.length;$('#rp').textContent=data.orders.reduce((a,o)=>a+o.qty-o.received,0);$('#reportTable').innerHTML=data.calculations.map(c=>`<tr><td>${c.time}</td><td>${c.size}</td><td>${money(c.cost100)}</td><td>${money(c.cost200)}</td><td>${c.profit}%</td><td>${money(c.sp100)}</td><td>${money(c.sp200)}</td></tr>`).join('')||'<tr><td colspan="7">No data.</td></tr>'}if(page==='settings'){if($('#setRod'))$('#setRod').value=data.settings.rodRate;if($('#setPVC'))$('#setPVC').value=data.settings.pvcRate}updateNotifCount()}
function quick(){let p=data.products.find(x=>x.size===$('#quickSize').value)||data.products[0];if(!p)return;let base=(p.rule*p.rodRate+p.weight*p.pvcRate)*(1+(p.labour||0)/100),cost=$('#quickLength').value==='200'?base*2:base,sp=cost*(1+(+$('#quickProfit').value||0)/100);$('#quickCost').textContent=money(cost);$('#quickSP').textContent=money(sp)}
let taskPage=1;
function renderTasks(){if(!$('#taskList'))return;const sf=$('#taskStatusFilter')?.value||'all',pf=$('#taskPriorityFilter')?.value||'all';let arr=data.tasks.filter(t=>(sf==='all'||t.status===sf)&&(pf==='all'||t.priority===pf));const pages=Math.max(1,Math.ceil(arr.length/10));taskPage=Math.min(taskPage,pages);const rows=arr.slice((taskPage-1)*10,taskPage*10);$('#taskList').innerHTML=rows.map(t=>`<div class="task"><div class="task-top"><div><b>${t.title}</b><small>Assigned: ${t.assignee} · Due: ${t.due||'Not set'} · <strong>${t.priority||'Medium'} Priority</strong></small></div><span class="status ${taskStatusClass(t.status)}">${t.status}</span></div><div class="task-actions"><select data-task-status="${t.id}"><option ${t.status==='Pending'?'selected':''}>Pending</option><option ${t.status==='Completed'?'selected':''}>Completed</option><option ${t.status==='Hold'?'selected':''}>Hold</option></select><button class="btn danger" data-delete-task="${t.id}">Delete</button></div></div>`).join('')||'<div class="empty">No work matches the selected filters.</div>';if($('#taskPageInfo'))$('#taskPageInfo').textContent=`${arr.length?((taskPage-1)*10+1):0}-${Math.min(taskPage*10,arr.length)} of ${arr.length} · 10 per page`;if($('#taskPrev'))$('#taskPrev').disabled=taskPage<=1;if($('#taskNext'))$('#taskNext').disabled=taskPage>=pages}

function renderProducts(){if(!$('#productsGrid'))return;const mode=localStorage.getItem('opsnoraMasterView')||'grid';$('#productsGrid').classList.toggle('masterListView',mode==='list');$('#productsGrid').innerHTML=data.products.map((p,i)=>mode==='list'?`<div class="masterListItem"><div class="pico">◇</div><div><h3>${p.size}</h3><p class="muted">Master Data</p></div><button class="btn secondary" data-edit-product="${i}">Edit</button></div>`:`<div class="card product"><div class="pico">◇</div><h3>${p.size}</h3><p class="muted">Master Data</p><button class="btn secondary" data-edit-product="${i}" style="margin-top:13px">Edit Master</button></div>`).join('')||'<div class="empty">No master data added yet.</div>'}

function updateNotifCount(){let today=new Date().toISOString().slice(0,10),n=data.tasks.filter(t=>t.due===today&&t.status!=='Completed').length;if($('#notifCount'))$('#notifCount').textContent=n||''}
function notify(){let old=$('.toast');if(old)old.remove();let today=new Date().toISOString().slice(0,10),ts=data.tasks.filter(t=>t.due===today&&t.status!=='Completed');let box=document.createElement('div');box.className='toast';box.innerHTML=`<h3>Today’s Notifications</h3>${ts.length?ts.map(t=>`<div class="toastItem"><b>${t.title}</b><br><span class="muted">${t.priority} priority · ${t.status}</span></div>`).join(''):'<p class="muted">No pending tasks for today.</p>'}`;document.body.append(box);const close=e=>{if(!box.contains(e.target)&&e.target.id!=='notifBtn'){box.remove();document.removeEventListener('click',close)}};setTimeout(()=>document.addEventListener('click',close),0)}
function modal(html){$('#modalContent').innerHTML=html;$('#modal').classList.remove('hide')}function closeModal(){if($('#modal'))$('#modal').classList.add('hide')}
function bind(){if($('#logoutBtn'))$('#logoutBtn').onclick=()=>{sessionStorage.removeItem('opsnoraCare');location.href='../index.html'};if($('#notifBtn'))$('#notifBtn').onclick=e=>{e.stopPropagation();notify()};if($('#closeModal'))$('#closeModal').onclick=closeModal;if($('#modal'))$('#modal').onclick=e=>{if(e.target.id==='modal')closeModal()};if($('#size'))$('#size').onchange=loadMaster;if($('#loadMaster'))$('#loadMaster').onclick=loadMaster;if($('#calcBundle'))$('#calcBundle').onclick=()=>calculateBundle(true);if($('#calcUnit'))$('#calcUnit').onclick=calculateUnit;
let selectedLength='100';
function updateSelectedLength(){let cost=selectedLength==='200'?(+$('#bundle200')?.textContent.replace(/[^0-9.]/g,'')||0):(+$('#bundle100')?.textContent.replace(/[^0-9.]/g,'')||0);let sp=selectedLength==='200'?(+$('#sp200')?.textContent.replace(/[^0-9.]/g,'')||0):(+$('#sp100')?.textContent.replace(/[^0-9.]/g,'')||0);if($('#selectedBundle'))$('#selectedBundle').textContent=money(cost);if($('#selectedBundleLabel'))$('#selectedBundleLabel').textContent=`Selected Length · ${selectedLength}M · Selling Price ${money(sp)}`;$$('[data-length]').forEach(x=>x.classList.toggle('on',x.dataset.length===selectedLength))}
$$('[data-length]').forEach(b=>b.onclick=()=>{selectedLength=b.dataset.length;updateSelectedLength()});
function calculationText(){let size=$('#size')?.value||'',wires=$('#wires')?.value||0,profit=$('#profit')?.value||0,length=$('#selectedLengthOut')?.textContent||'100M',cost=$('#bundleCost')?.textContent||money(0),selling=$('#bundleSelling')?.textContent||money(0),unit=$('#unitResult')?.textContent||'';let tpl=localStorage.getItem('opsnoraWaMaster')||'Hello,\n\nPlease find the costing details below:\nSize: {{Size}}\nLength: {{Length}}\nCost Price: {{Cost Price}}\nSelling Price: {{Selling Price}}\nProfit: {{Profit}}%\n\nThank you.';const vals={'{{Size}}':size,'{{Wires}}':wires,'{{Length}}':length,'{{Cost Price}}':cost,'{{Selling Price}}':selling,'{{Profit}}':profit,'{{Unit Cost}}':unit};return Object.entries(vals).reduce((txt,[k,v])=>txt.split(k).join(v),tpl)}
if($('#shareCalc'))$('#shareCalc').onclick=async()=>{let text=calculationText();try{if(navigator.share)await navigator.share({title:'CARE Electrical Costing',text});else await navigator.clipboard.writeText(text);alert(navigator.share?'Calculation shared.':'Calculation copied to clipboard.')}catch(e){}};
function getHistorySelected(){return $$('.historyCheck:checked').map(x=>x.dataset.historyKey).map(k=>k[0]==='b'?data.calculations[+k.slice(1)]:data.unitCalculations[+k.slice(1)]).filter(Boolean)}
function historyItemText(c){const tpl=localStorage.getItem('opsnoraWaMaster')||'Hello,\n\nPlease find the costing details below:\nSize: {{Size}}\nWires: {{Wires}}\nLength: {{Length}}\nCost Price: {{Cost Price}}\nSelling Price: {{Selling Price}}\nProfit: {{Profit}}%\n\nThank you.';const vals={'{{Size}}':c.size??'','{{Wires}}':c.wires??'','{{Length}}':c.length??c.bundleLength??'','{{Cost Price}}':fmt(c.costPrice??c.cost??c.costPerUnit??0),'{{Selling Price}}':fmt(c.sellingPrice??c.selling??0),'{{Profit}}':c.profit??0,'{{Unit Cost}}':fmt(c.costPerUnit??0)};return Object.entries(vals).reduce((x,[k,v])=>x.split(k).join(v),tpl)}
function whatsappHistorySelected(){const items=getHistorySelected();if(!items.length)return alert('Select at least 1 calculation from history.');const text=items.map((x,i)=>`Calculation ${i+1}\n${historyItemText(x)}`).join('\n\n--------------------\n\n');const u=JSON.parse(localStorage.getItem('opsnoraUsage')||'{}');u.whatsappShares=(Number(u.whatsappShares)||0)+1;u.sharedValue=(Number(u.sharedValue)||0)+items.reduce((a,x)=>a+Number(x.sellingPrice??x.selling??x.sp100??0),0);localStorage.setItem('opsnoraUsage',JSON.stringify(u));window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,'_blank')}
if($('#whatsappCalc'))$('#whatsappCalc').onclick=()=>{let text=encodeURIComponent(calculationText());let u=JSON.parse(localStorage.getItem('opsnoraUsage')||'{}');u.whatsappShares=(Number(u.whatsappShares)||0)+1;let shared=Number(document.querySelector('#bundleSelling')?.textContent?.replace(/[^0-9.]/g,'')||0);u.sharedValue=(Number(u.sharedValue)||0)+shared;localStorage.setItem('opsnoraUsage',JSON.stringify(u));window.open(`https://wa.me/?text=${text}`,'_blank')};
if($('#downloadCalc'))$('#downloadCalc').onclick=()=>{let blob=new Blob([calculationText()],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`CARE-Costing-${($('#size')?.value||'calculation')}-${selectedLength}M.txt`;a.click();URL.revokeObjectURL(url)};$$('[data-mode]').forEach(b=>b.onclick=()=>{$$('[data-mode]').forEach(x=>x.classList.toggle('on',x===b));$('#bundleFields').classList.toggle('hide',b.dataset.mode!=='bundle');$('#unitFields').classList.toggle('hide',b.dataset.mode!=='unit')});['quickSize','quickLength','quickProfit'].forEach(id=>{if($('#'+id))$('#'+id).oninput=quick});if($('#taskStatusFilter'))$('#taskStatusFilter').onchange=()=>{taskPage=1;renderTasks()};if($('#taskPriorityFilter'))$('#taskPriorityFilter').onchange=()=>{taskPage=1;renderTasks()};if($('#taskPrev'))$('#taskPrev').onclick=()=>{taskPage=Math.max(1,taskPage-1);renderTasks()};if($('#taskNext'))$('#taskNext').onclick=()=>{taskPage++;renderTasks()};if($('#masterGridView'))$('#masterGridView').onclick=()=>{localStorage.setItem('opsnoraMasterView','grid');renderProducts()};if($('#masterListView'))$('#masterListView').onclick=()=>{localStorage.setItem('opsnoraMasterView','list');renderProducts()};if($('#clearCalc'))$('#clearCalc').onclick=()=>{const mode=$('#historyType')?.value||'all';if(confirm('Clear '+(mode==='all'?'all':'selected')+' calculation history?')){if(mode==='all'){data.calculations=[];data.unitCalculations=[]}else if(mode==='bundle')data.calculations=[];else data.unitCalculations=[];save();renderHistory()}};if($('#newTask'))$('#newTask').onclick=()=>modal(`<h2>Assign Work</h2><label class="label">Task</label><input id="nt"><label class="label">Assign To</label><input id="na" value="Admin User"><label class="label">Priority</label><select id="np"><option>High</option><option>Medium</option><option>Low</option></select><label class="label">Status</label><select id="ns"><option>Pending</option><option>Completed</option><option>Hold</option></select><label class="label">Due Date</label><input id="nd" type="date"><button class="btn primary" id="saveTask" style="margin-top:17px">Assign Task</button>`);if($('#newUser'))$('#newUser').onclick=()=>modal(`<h2>Add User</h2><label class="label">Name</label><input id="un"><label class="label">Email / Username</label><input id="ue"><label class="label">Role</label><select id="ur"><option>Standard User</option><option>Manager</option><option>Administrator</option></select><button class="btn primary" id="saveUser" style="margin-top:17px">Create User</button>`);if($('#newOrder'))$('#newOrder').onclick=()=>modal(`<h2>New Order</h2><label class="label">Dealer</label><input id="od"><label class="label">Item</label><input id="oi"><label class="label">Quantity</label><input id="oq" type="number"><label class="label">Rate</label><input id="orate" type="number"><button class="btn primary" id="saveOrder" style="margin-top:17px">Create Order</button>`);if($('#newProduct'))$('#newProduct').onclick=()=>modal(`<h2>Add Product Master</h2><label class="label">Size</label><input id="ps"><label class="label">Wires</label><input id="pw" type="number"><label class="label">Rule</label><input id="pr" type="number" step="0.00001"><label class="label">Rod Rate</label><input id="pR" type="number"><label class="label">Weight</label><input id="pwt" type="number" step="0.00001"><label class="label">PVC Rate</label><input id="pP" type="number"><label class="label">Labour %</label><input id="pl" type="number"><button class="btn primary" id="saveProduct" style="margin-top:17px">Save Master</button>`);if($('#saveSettings'))$('#saveSettings').onclick=()=>{data.settings={rodRate:+$('#setRod').value||0,pvcRate:+$('#setPVC').value||0};save();alert('Settings saved')};if($('#resetData'))$('#resetData').onclick=()=>{if(confirm('Reset demo data?')){localStorage.removeItem('opsnoraCareData');location.reload()}};if($('#export'))$('#export').onclick=()=>{let rows=[['Time','Size','100m Cost','200m Cost','Profit','SP100','SP200'],...data.calculations.map(c=>[c.time,c.size,c.cost100,c.cost200,c.profit,c.sp100,c.sp200])];let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'}));a.download='opsnora-calculations.csv';a.click();URL.revokeObjectURL(a.href)};$$('[data-auto]').forEach(x=>{let k='opsAuto_'+x.dataset.auto;if(localStorage[k]==='on')x.classList.add('on');x.onclick=()=>{x.classList.toggle('on');localStorage[k]=x.classList.contains('on')?'on':'off'}})}
document.addEventListener('click',e=>{if(e.target.id==='saveTask'){if(!$('#nt').value.trim())return alert('Enter a task');data.tasks.unshift({id:'T'+Date.now(),title:$('#nt').value.trim(),assignee:$('#na').value||'Admin User',priority:$('#np').value,status:$('#ns').value,due:$('#nd').value});save();closeModal()}if(e.target.id==='saveUser'){if(!$('#un').value.trim()||!$('#ue').value.trim())return alert('Enter name and email');data.users.push({name:$('#un').value.trim(),username:$('#ue').value.trim(),role:$('#ur').value,status:'Active',last:'Never'});save();closeModal()}if(e.target.id==='saveOrder'){let q=+$('#oq').value||0;if(!$('#od').value.trim()||!q)return alert('Enter dealer and quantity');data.orders.unshift({id:'ORD-'+Date.now().toString().slice(-5),dealer:$('#od').value.trim(),item:$('#oi').value.trim()||'Wire',qty:q,rate:+$('#orate').value||0,received:0,history:[]});save();closeModal()}if(e.target.id==='saveProduct'){let p={size:$('#ps').value.trim(),wires:+$('#pw').value||0,rule:+$('#pr').value||0,rodRate:+$('#pR').value||0,weight:+$('#pwt').value||0,pvcRate:+$('#pP').value||0,labour:+$('#pl').value||0};if(!p.size)return alert('Enter size');data.products.push(p);save();closeModal()}if(e.target.dataset.deleteTask){data.tasks=data.tasks.filter(t=>t.id!==e.target.dataset.deleteTask);save()}if(e.target.dataset.editProduct!==undefined){let i=+e.target.dataset.editProduct,p=data.products[i];modal(`<h2>Edit Product Master</h2><label class="label">Size</label><input id="ps" value="${p.size}"><label class="label">Wires</label><input id="pw" type="number" value="${p.wires}"><label class="label">Rule</label><input id="pr" type="number" step="0.00001" value="${p.rule}"><label class="label">Rod Rate</label><input id="pR" type="number" value="${p.rodRate}"><label class="label">Weight</label><input id="pwt" type="number" step="0.00001" value="${p.weight}"><label class="label">PVC Rate</label><input id="pP" type="number" value="${p.pvcRate}"><label class="label">Labour %</label><input id="pl" type="number" value="${p.labour}"><button class="btn primary" id="updateProduct" data-index="${i}" style="margin-top:17px">Update Master</button>`)}if(e.target.id==='updateProduct'){let i=+e.target.dataset.index;data.products[i]={size:$('#ps').value.trim(),wires:+$('#pw').value||0,rule:+$('#pr').value||0,rodRate:+$('#pR').value||0,weight:+$('#pwt').value||0,pvcRate:+$('#pP').value||0,labour:+$('#pl').value||0};save();closeModal()}});document.addEventListener('change',e=>{if(e.target.dataset.taskStatus){let t=data.tasks.find(x=>x.id===e.target.dataset.taskStatus);if(t){t.status=e.target.value;save()}}});bind();refresh();initMobileSidebar();applyLicenseGuards();initMainAdmin();

// === OPSNORA COSTING OVERRIDE ===
(function(){
  const q=(id)=>document.querySelector(id), qa=(sel)=>[...document.querySelectorAll(sel)];
  if(!q('#bundleFields')) return;
  let selectedLength='100';
  const fmt=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number(n)||0);
  const sizeVal=()=>q('#size')?.value==='others'?Number(q('#customSize')?.value):Number(q('#size')?.value);
  const rule=()=>sizeVal()*sizeVal()*Number(q('#wires')?.value)*451;
  const bundleFactor=()=>selectedLength==='200'?2:1;

  function init(){
    const sel=q('#size');
    if(sel){
      sel.innerHTML='<option value="">Select size</option>'+data.products.map(p=>`<option value="${p.size}">${p.size}</option>`).join('')+'<option value="others">Others</option>';
      sel.value='';
      sel.addEventListener('change',()=>{
        q('#customSize').classList.toggle('hide',sel.value!=='others');
        if(sel.value!=='others') q('#customSize').value='';
        resetWeightState();
      });
    }
    ['wires','rodRate','weight','pvcRate','labour','profit','customSize'].forEach(id=>{const e=q('#'+id);if(e)e.value='';});
    q('#weight')?.addEventListener('blur',adjustWeight);
    ['size','customSize','wires'].forEach(id=>q('#'+id)?.addEventListener('input',resetWeightState));
    qa('[data-length]').forEach(b=>b.addEventListener('click',()=>{selectedLength=b.dataset.length;updateLength();}));
    q('#loadMaster')?.addEventListener('click',loadMasterValues);
    q('#calcBundle')?.addEventListener('click',calculateAndSave);
    q('#calcUnit')?.addEventListener('click',calculateUnitNew);
    q('#historyType')?.addEventListener('change',()=>{historyPage=1;renderHistory()});
    q('#historyPrev')?.addEventListener('click',()=>{if(historyPage>1){historyPage--;renderHistory()}});
    q('#historyNext')?.addEventListener('click',()=>{const mode=q('#historyType')?.value||'all';const total=(mode==='all'?(data.calculations||[]).length+(data.unitCalculations||[]).length:mode==='bundle'?(data.calculations||[]).length:(data.unitCalculations||[]).length);const pages=Math.max(1,Math.ceil(total/10));if(historyPage<pages){historyPage++;renderHistory()}});
    q('#whatsappHistory')?.addEventListener('click',sendSelectedHistoryToWhatsApp);

    restoreLast();
    updateLength();
    renderHistory();
  }

  function resetWeightState(){const w=q('#weight');if(w){w.dataset.adjusted='';w.dataset.original='';}}
  function updateLength(){
    qa('[data-length]').forEach(b=>b.classList.toggle('on',b.dataset.length===selectedLength));
    if(q('#selectedLengthOut')) q('#selectedLengthOut').textContent=selectedLength+'M';
  }

  // PVC is calculated on net PVC weight: (total weight - rule) × PVC rate.
  function adjustWeight(){
    const w=q('#weight');
    if(!w||w.dataset.adjusted==='1'||!w.value.trim())return;
    const r=rule(),entered=Number(w.value);
    if(!Number.isFinite(r)||!Number.isFinite(entered)||r<=0)return;
    w.dataset.original=entered;
    w.value=Math.max(0,entered-r).toFixed(5).replace(/0+$/,'').replace(/\.$/,'');
    w.dataset.adjusted='1';
  }

  function loadMasterValues(){
    const p=data.products.find(x=>String(x.size)===String(q('#size').value));
    if(!p||q('#size').value==='others')return alert('Select a master size first.');
    q('#wires').value=p.wires??'';
    q('#rodRate').value=p.rodRate??'';
    q('#weight').value=p.weight??'';
    q('#pvcRate').value=p.pvcRate??'';
    q('#labour').value=p.labour??'';
    resetWeightState();
  }

  function valid(){
    return [sizeVal(),Number(q('#wires').value),Number(q('#rodRate').value),Number(q('#weight').value),Number(q('#pvcRate').value),Number(q('#labour').value),Number(q('#profit').value)].every(Number.isFinite)&&q('#size').value!=='';
  }

  function calculateValues(){
    adjustWeight();
    if(!valid())throw new Error('Please fill all values.');
    const r=rule(),f=bundleFactor(),net=Number(q('#weight').value);
    const rod=r*Number(q('#rodRate').value)*f;
    const pvc=net*Number(q('#pvcRate').value)*f;
    const base=rod+pvc;
    const lab=base*Number(q('#labour').value)/100;
    const cost=base+lab;
    const sell=cost*(1+Number(q('#profit').value)/100);
    return{r,rod,pvc,base,lab,cost,sell,net};
  }

  function show(v){
    q('#bundleCost').textContent=fmt(v.cost);
    q('#bundleSelling').textContent=fmt(v.sell);
    [['rodOut',v.rod],['pvcOut',v.pvc],['baseOut',v.base],['labourOut',v.lab]].forEach(([id,x])=>q('#'+id).textContent=fmt(x));
    q('#unitCost').value=v.cost.toFixed(2);
    updateLength();
  }

  function calculateAndSave(){
    try{
      const v=calculateValues();
      show(v);
      const item={
        type:'bundle',time:new Date().toLocaleString('en-IN'),length:selectedLength+'M',size:sizeVal(),wires:Number(q('#wires').value),
        rule:v.r,weight:Number(q('#weight').value),netWeight:v.net,pvcRate:Number(q('#pvcRate').value),rodRate:Number(q('#rodRate').value),
        profit:Number(q('#profit').value),costPrice:v.cost,sellingPrice:v.sell,rod:v.rod,pvc:v.pvc,labourCost:v.lab
      };
      data.calculations.unshift(item);
      localStorage.setItem('opsnoraCareData',JSON.stringify(data));
      localStorage.setItem('opsnoraLastCosting',JSON.stringify(item));
      renderHistory();
    }catch(e){alert(e.message)}
  }

  let historyPage=1;
  function historySelectedItems(){
    return qa('.historyCheck:checked').map(el=>{
      const k=el.dataset.historyKey||'';
      if(k.startsWith('b')) return (data.calculations||[])[Number(k.slice(1))];
      if(k.startsWith('u')) return (data.unitCalculations||[])[Number(k.slice(1))];
      return null;
    }).filter(Boolean);
  }
  function historyMessage(c){
    const tpl=localStorage.getItem('opsnoraWaMaster')||'Hello,\n\nPlease find the costing details below:\nSize: {{Size}}\nWires: {{Wires}}\nLength: {{Length}}\nCost Price: {{Cost Price}}\nSelling Price: {{Selling Price}}\nProfit: {{Profit}}%\n\nThank you.';
    const vals={'{{Size}}':c.size??'','{{Wires}}':c.wires??'','{{Length}}':c.length??c.bundleLength??'','{{Cost Price}}':fmt(c.costPrice??c.cost??c.costPerUnit??c.cost100??0),'{{Selling Price}}':fmt(c.sellingPrice??c.selling??c.sp100??0),'{{Profit}}':c.profit??0,'{{Unit Cost}}':fmt(c.costPerUnit??0)};
    return Object.entries(vals).reduce((txt,[k,v])=>txt.split(k).join(String(v)),tpl);
  }
  function sendSelectedHistoryToWhatsApp(){
    const items=historySelectedItems();
    if(!items.length){alert('Select at least 1 calculation from history.');return;}
    const text=items.map((item,i)=>`Calculation ${i+1}\n${historyMessage(item)}`).join('\n\n--------------------\n\n');
    const usage=JSON.parse(localStorage.getItem('opsnoraUsage')||'{}');
    usage.whatsappShares=(Number(usage.whatsappShares)||0)+1;
    usage.sharedValue=(Number(usage.sharedValue)||0)+items.reduce((sum,item)=>sum+Number(item.sellingPrice??item.selling??item.sp100??0),0);
    localStorage.setItem('opsnoraUsage',JSON.stringify(usage));
    const url='https://wa.me/?text='+encodeURIComponent(text);
    const win=window.open(url,'_blank');
    if(!win) window.location.href=url;
  }

  function renderHistory(){
    const t=q('#calcTable'),head=q('#historyHead'),mode=q('#historyType')?.value||'all'; if(!t||!head)return;
    const bundles=data.calculations||[],units=data.unitCalculations||[];
    let rows=[];
    if(mode==='all') rows=[...bundles.map((c,i)=>({...c,_type:'Bundle',_idx:i,_key:'b'+i,length:c.length||'100M',cost:c.costPrice??c.cost100,selling:c.sellingPrice??c.sp100})),...units.map((c,i)=>({...c,_type:'Unit',_idx:i,_key:'u'+i,cost:c.costPerUnit,selling:c.sellingPrice}))].sort((a,b)=>String(b.time).localeCompare(String(a.time)));
    else if(mode==='bundle') rows=bundles.map((c,i)=>({...c,_type:'Bundle',_idx:i,_key:'b'+i,length:c.length||'100M',cost:c.costPrice??c.cost100,selling:c.sellingPrice??c.sp100}));
    else rows=units.map((c,i)=>({...c,_type:'Unit',_idx:i,_key:'u'+i,cost:c.costPerUnit,selling:c.sellingPrice}));
    const pages=Math.max(1,Math.ceil(rows.length/10)); historyPage=Math.min(historyPage,pages); const view=rows.slice((historyPage-1)*10,historyPage*10);
    if(mode==='unit') head.innerHTML='<tr><th>Select</th><th>Time</th><th>Bundle</th><th>Unit Length</th><th>Bundle Cost</th><th>Moulding</th><th>Profit %</th><th>Unit Cost</th><th>Selling Price</th></tr>';
    else if(mode==='bundle') head.innerHTML='<tr><th>Select</th><th>Time</th><th>Length</th><th>Size</th><th>Wires</th><th>Cost Price</th><th>Profit %</th><th>Selling Price</th></tr>';
    else head.innerHTML='<tr><th>Select</th><th>Type</th><th>Time</th><th>Length</th><th>Size</th><th>Cost</th><th>Selling Price</th></tr>';
    t.innerHTML=view.map(c=>mode==='unit'?`<tr><td><input type="checkbox" class="historyCheck" data-history-key="${c._key}"></td><td>${c.time||''}</td><td>${c.bundleLength||''} · ${c.size??''}</td><td>${c.length??''}</td><td>${fmt(c.bundleCost)}</td><td>${fmt(c.moulding)}</td><td>${c.profit??0}%</td><td>${fmt(c.costPerUnit)}</td><td>${fmt(c.sellingPrice)}</td></tr>`:mode==='bundle'?`<tr><td><input type="checkbox" class="historyCheck" data-history-key="${c._key}"></td><td>${c.time||''}</td><td>${c.length||'100M'}</td><td>${c.size??''}</td><td>${c.wires??0}</td><td>${fmt(c.cost)}</td><td>${c.profit??0}%</td><td>${fmt(c.selling)}</td></tr>`:`<tr><td><input type="checkbox" class="historyCheck" data-history-key="${c._key}"></td><td>${c._type}</td><td>${c.time||''}</td><td>${c.length??''}</td><td>${c.size??''}</td><td>${fmt(c.cost)}</td><td>${fmt(c.selling)}</td></tr>`).join('')||`<tr><td colspan="9">No saved calculations yet.</td></tr>`;
    if(q('#historyPageInfo'))q('#historyPageInfo').textContent=`${rows.length?((historyPage-1)*10+1):0}-${Math.min(historyPage*10,rows.length)} of ${rows.length} · 10 per page`; if(q('#historyPrev'))q('#historyPrev').disabled=historyPage<=1;if(q('#historyNext'))q('#historyNext').disabled=historyPage>=pages;
  }

  function restoreLast(){
    const x=JSON.parse(localStorage.getItem('opsnoraLastCosting')||'null');
    if(!x)return;
    selectedLength=String(x.length||'100M').replace('M','');
    q('#bundleCost').textContent=fmt(x.costPrice??x.cost100);
    q('#bundleSelling').textContent=fmt(x.sellingPrice??x.sp100);
  }

  function calculateUnitNew(){
    const length=Number(q('#unitLength').value),cost=Number(q('#unitCost').value),mould=Number(q('#moulding').value),profit=Number(q('#unitProfit').value);
    if(![length,cost,mould,profit].every(Number.isFinite)||length<=0)return alert('Please fill all unit-wise values.');
    const base=cost/length+mould,p=base*profit/100,sp=base+p;
    q('#unitBase').textContent=fmt(cost/length);
    q('#mouldOut').textContent=fmt(mould);
    q('#unitProfitOut').textContent=fmt(p);
    q('#unitResult').textContent=fmt(sp);

    const bundleItem=data.calculations[0]||{};
    const item={
      type:'unit',time:new Date().toLocaleString('en-IN'),bundleLength:bundleItem.length||selectedLength+'M',size:bundleItem.size??(q('#size')?.value||''),
      length,costInput:cost,bundleCost:cost,moulding:mould,profit,costPerUnit:base,sellingPrice:sp,
      unitBase:cost/length,profitAmount:p
    };
    data.unitCalculations.unshift(item);
    localStorage.setItem('opsnoraCareData',JSON.stringify(data));
    localStorage.setItem('opsnoraLastUnitCosting',JSON.stringify(item));
    if(q('#historyType'))q('#historyType').value='unit';
    renderHistory();
  }

  init();
})();

applyLicenseGuards();
