import '@fontsource/geist-sans/400.css';
import '@fontsource/geist-sans/500.css';
import '@fontsource/geist-sans/600.css';
import '@fontsource/geist-sans/700.css';
import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {supabase,cloudReady} from './supabase';
import {LayoutDashboard,CheckSquare,BookOpen,CalendarDays,Timer,Plus,Search,ChevronDown,Trash2,Check,Clock3,Target,Flame,LogOut,Menu,X,ArrowUpRight,Play,Pause,RotateCcw,Settings,Pencil,Sun,Moon,Monitor,CircleUser,Palette,Bell,SlidersHorizontal,ShieldCheck,FileText,Upload,Download,ExternalLink,File,FilePlus2} from 'lucide-react';
import './styles.css';

const seedSubjects=[{id:'s1',name:'Work Project',code:'PRJ',category:'Work',color:'#8b5cf6',icon:'book-open',target_hours:30},{id:'s2',name:'Personal Growth',code:'LIFE',category:'Personal',color:'#06b6d4',icon:'database',target_hours:25},{id:'s3',name:'Learning',code:'LEARN',category:'Learning',color:'#f59e0b',icon:'network',target_hours:25},{id:'s4',name:'Home & Life',code:'LIFE',category:'Personal',color:'#ec4899',icon:'cpu',target_hours:18}];
const seedTasks=[{id:'t1',title:'Review project notes',subject_id:'s1',due_date:'2026-09-11',priority:'High',status:'In Progress',estimated_minutes:60,tags:['review'],notes:''},{id:'t2',title:'Finish weekly plan',subject_id:'s2',due_date:'2026-09-12',priority:'Urgent',status:'Todo',estimated_minutes:45,tags:['planning'],notes:''},{id:'t3',title:'Read and summarize an article',subject_id:'s3',due_date:'2026-09-10',priority:'Medium',status:'Todo',estimated_minutes:30,tags:['learning'],notes:''}];
function uid(){return crypto.randomUUID?.()||Math.random().toString(36).slice(2)}

const ATTACHMENT_DB='orbit_attachment_store';
const ATTACHMENT_STORE='pdfs';
function openAttachmentDB(){return new Promise((resolve,reject)=>{if(!('indexedDB' in window)){reject(new Error('IndexedDB unavailable'));return}const req=indexedDB.open(ATTACHMENT_DB,1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(ATTACHMENT_STORE)){const store=db.createObjectStore(ATTACHMENT_STORE,{keyPath:'id'});store.createIndex('subject_id','subject_id',{unique:false})}};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('Unable to open attachment storage'))})}
async function listSubjectPdfs(subjectId){const db=await openAttachmentDB();return new Promise((resolve,reject)=>{const tx=db.transaction(ATTACHMENT_STORE,'readonly');const req=tx.objectStore(ATTACHMENT_STORE).index('subject_id').getAll(subjectId);req.onsuccess=()=>{db.close();resolve(req.result.sort((a,b)=>b.created_at.localeCompare(a.created_at)))};req.onerror=()=>{db.close();reject(req.error)}})}
async function saveSubjectPdf(subjectId,file){const db=await openAttachmentDB();const row={id:uid(),subject_id:subjectId,name:file.name,size:file.size,type:file.type||'application/pdf',created_at:new Date().toISOString(),blob:file};return new Promise((resolve,reject)=>{const tx=db.transaction(ATTACHMENT_STORE,'readwrite');tx.objectStore(ATTACHMENT_STORE).put(row);tx.oncomplete=()=>{db.close();resolve(row)};tx.onerror=()=>{db.close();reject(tx.error)}})}
async function deleteSubjectPdf(id){const db=await openAttachmentDB();return new Promise((resolve,reject)=>{const tx=db.transaction(ATTACHMENT_STORE,'readwrite');tx.objectStore(ATTACHMENT_STORE).delete(id);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)}})}
async function readSubjectPdf(id){const db=await openAttachmentDB();return new Promise((resolve,reject)=>{const req=db.transaction(ATTACHMENT_STORE,'readonly').objectStore(ATTACHMENT_STORE).get(id);req.onsuccess=()=>{db.close();resolve(req.result)};req.onerror=()=>{db.close();reject(req.error)}})}
function formatBytes(bytes){if(!bytes)return '0 KB';const units=['B','KB','MB','GB'];const i=Math.min(Math.floor(Math.log(bytes)/Math.log(1024)),units.length-1);return `${(bytes/1024**i).toFixed(i?1:0)} ${units[i]}`}
function playCompletionSound(){
 try{
  const C=window.AudioContext||window.webkitAudioContext;
  if(!C)return;
  const ctx=new C();
  const now=ctx.currentTime;
  [0,0.16,0.32].forEach((offset,i)=>{
   const osc=ctx.createOscillator();
   const gain=ctx.createGain();
   osc.type='sine';
   osc.frequency.value=[660,880,1046.5][i];
   gain.gain.setValueAtTime(0.0001,now+offset);
   gain.gain.exponentialRampToValueAtTime(0.16,now+offset+0.02);
   gain.gain.exponentialRampToValueAtTime(0.0001,now+offset+0.13);
   osc.connect(gain).connect(ctx.destination);
   osc.start(now+offset);
   osc.stop(now+offset+0.14);
  });
  setTimeout(()=>ctx.close?.(),700);
 }catch{}
}
function formatDashboardDate(date=new Date()){return date.toLocaleDateString(undefined,{weekday:'long',day:'2-digit',month:'short',year:'numeric'}).toUpperCase().replace(',', ' ·')}
function localDateKey(date=new Date()){const y=date.getFullYear();const m=String(date.getMonth()+1).padStart(2,'0');const d=String(date.getDate()).padStart(2,'0');return `${y}-${m}-${d}`}

function App(){
 const [user,setUser]=useState(null);
 const [theme,setTheme]=useState(()=>localStorage.getItem('orbit_theme')||'dark'); const [density,setDensity]=useState(()=>localStorage.getItem('orbit_density')||'Comfortable'); const [subjects,setSubjects]=useState([]); const [tasks,setTasks]=useState([]); const [sessions,setSessions]=useState([]); const [tab,setTab]=useState('Dashboard'); const [search,setSearch]=useState(''); const [filter,setFilter]=useState('All'); const [modal,setModal]=useState(null); const [mobile,setMobile]=useState(false); const [timer,setTimer]=useState(()=>Number(localStorage.getItem('orbit_default_focus')||25)*60); const [running,setRunning]=useState(false); const [focusMode,setFocusMode]=useState('pomodoro'); const [pomodoros,setPomodoros]=useState(1); const [customMinutes,setCustomMinutes]=useState(30); const [profileOpen,setProfileOpen]=useState(false); const [searchOpen,setSearchOpen]=useState(false); const [sidebarCollapsed,setSidebarCollapsed]=useState(()=>localStorage.getItem('orbit_sidebar_collapsed')==='1'); const [selectedSubject,setSelectedSubject]=useState(null); const [settingsPanel,setSettingsPanel]=useState(null); const [sessionModal,setSessionModal]=useState(false); const [subjectEdit,setSubjectEdit]=useState(null); const [authModal,setAuthModal]=useState(false);
 useEffect(()=>{
  const root=document.documentElement;
  const apply=()=>{
   const resolved=theme==='system'?(window.matchMedia?.('(prefers-color-scheme: light)').matches?'light':'dark'):theme;
   root.dataset.theme=resolved;
   root.dataset.themePreference=theme;
  };
  apply();
  const media=window.matchMedia?.('(prefers-color-scheme: light)');
  const onChange=()=>theme==='system'&&apply();
  media?.addEventListener?.('change',onChange);
  localStorage.setItem('orbit_theme',theme);
  return()=>media?.removeEventListener?.('change',onChange);
 },[theme]);
 useEffect(()=>{ if(cloudReady){supabase.auth.getSession().then(({data})=>{const nextUser=data.session?.user||null;setUser(nextUser);if(nextUser){setAuthModal(false);setSettingsPanel(null)}}); const {data:sub}=supabase.auth.onAuthStateChange((_e,s)=>{const nextUser=s?.user||null;setUser(nextUser);if(nextUser){setAuthModal(false);setSettingsPanel(null)}}); return()=>sub.subscription.unsubscribe()} else {setSubjects(JSON.parse(localStorage.getItem('orbit_subjects')||'null')||seedSubjects);setTasks(JSON.parse(localStorage.getItem('orbit_tasks')||'null')||seedTasks);setSessions(JSON.parse(localStorage.getItem('orbit_sessions')||'[]'))}},[]);
 useEffect(()=>{if(!cloudReady){localStorage.setItem('orbit_subjects',JSON.stringify(subjects));localStorage.setItem('orbit_tasks',JSON.stringify(tasks));localStorage.setItem('orbit_sessions',JSON.stringify(sessions))}},[subjects,tasks,sessions]);
 const completionArmed=useRef(false);
 useEffect(()=>{
  if(running)completionArmed.current=true;
  if(!running&&timer===0&&completionArmed.current){
   completionArmed.current=false;
   if(localStorage.getItem('orbit_focus_sound')!=='off')playCompletionSound();
  }
 },[running,timer]);
 useEffect(()=>{
  if(!running)return;
  const i=setInterval(()=>setTimer(t=>Math.max(0,t-1)),1000);
  return()=>clearInterval(i);
 },[running]);
 useEffect(()=>{
  if(typeof document==='undefined')return;
  const closeHeaderPopups=e=>{
   const target=e.target;
   if(!target?.closest?.('.profile'))setProfileOpen(false);
   if(!target?.closest?.('.search'))setSearchOpen(false);
  };
  document.addEventListener('mousedown',closeHeaderPopups);
  return()=>document.removeEventListener('mousedown',closeHeaderPopups);
 },[]);
 useEffect(()=>{if(user)loadCloud()},[user]);
 useEffect(()=>{ if(selectedSubject && !subjects.some(s=>s.id===selectedSubject)) setSelectedSubject(null)},[subjects,selectedSubject]);
 async function loadCloud(){const [{data:s},{data:t},{data:ss}]=await Promise.all([supabase.from('subjects').select('*').order('created_at'),supabase.from('tasks').select('*').order('created_at',{ascending:false}),supabase.from('study_sessions').select('*').order('session_date',{ascending:false})]);setSubjects(s||[]);setTasks(t||[]);setSessions(ss||[])}
 async function login(){setSettingsPanel(null);setAuthModal(true)}
 async function loginGoogle(){if(!cloudReady){alert('Cloud sign-in needs Supabase setup. Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.');return}const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin}});if(error)alert(`Google sign-in failed. ${error.message}`);else setAuthModal(false)}
 async function loginPhone(phone){if(!cloudReady){throw new Error('Phone OTP needs Supabase setup. Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.')}const {error}=await supabase.auth.signInWithOtp({phone,options:{shouldCreateUser:true}});if(error)throw error}
 async function verifyPhone(phone,token){if(!cloudReady)throw new Error('Supabase is not configured.');const {error}=await supabase.auth.verifyOtp({phone,token,type:'sms'});if(error)throw error;setAuthModal(false)}
 async function logout(){if(supabase)await supabase.auth.signOut();setUser(null);setProfileOpen(false);setSettingsPanel(null)}
 async function saveSubject(v){const row={...v,user_id:user?.id,notes:v.notes||''};if(cloudReady&&user){const {data}=await supabase.from('subjects').insert(row).select().single();if(data)setSubjects(x=>[...x,data])}else setSubjects(x=>[...x,{...v,id:uid()}]);setModal(null)}
 async function updateSubject(subject,v){const changes={name:v.name.trim(),code:v.code.trim(),category:v.category,color:v.color,target_hours:Number(v.target_hours)||0,notes:v.notes||''};if(cloudReady&&user){const {data,error}=await supabase.from('subjects').update(changes).eq('id',subject.id).select().single();if(error){alert(`Could not update subject. ${error.message}`);return false}setSubjects(x=>x.map(s=>s.id===subject.id?{...s,...data}:s))}else setSubjects(x=>x.map(s=>s.id===subject.id?{...s,...changes}:s));setSubjectEdit(null);return true}
 async function saveTask(v){const isEdit=Boolean(v.id);const row={...v,user_id:user?.id,tags:v.tags||[]};if(isEdit)delete row.id;if(cloudReady&&user){if(isEdit){const {data,error}=await supabase.from('tasks').update(row).eq('id',v.id).select().single();if(error){alert(`Could not update task. ${error.message}`);return}if(data)setTasks(x=>x.map(t=>t.id===v.id?data:t))}else{const {data,error}=await supabase.from('tasks').insert(row).select().single();if(error){alert(`Could not create task. ${error.message}`);return}if(data)setTasks(x=>[data,...x])}}else if(isEdit){setTasks(x=>x.map(t=>t.id===v.id?{...t,...v}:t))}else setTasks(x=>[{...v,id:uid()},...x]);setModal(null)}
 async function toggleTask(t){const status=t.status==='Done'?'Todo':'Done';if(cloudReady&&user)await supabase.from('tasks').update({status,completed_at:status==='Done'?new Date().toISOString():null}).eq('id',t.id);setTasks(x=>x.map(a=>a.id===t.id?{...a,status}:a))}
 async function updateTask(t,changes){const next={...t,...changes};if(cloudReady&&user){const payload={};for(const key of ['subject_id','due_date','priority','estimated_minutes']) if(key in changes) payload[key]=changes[key];await supabase.from('tasks').update(payload).eq('id',t.id)}setTasks(x=>x.map(a=>a.id===t.id?next:a))}
 async function deleteTask(t){
  if(!window.confirm(`Delete “${t.title}”? This cannot be undone.`)) return;
  if(cloudReady&&user){const {error}=await supabase.from('tasks').delete().eq('id',t.id);if(error){alert(`Could not delete task. ${error.message}`);return}}
  setTasks(x=>x.filter(a=>a.id!==t.id));
 }
 async function deleteSubject(subject){
  if(!subject) return;
  const count=tasks.filter(t=>t.subject_id===subject.id).length;
  const message=count?`Delete “${subject.name}” and its ${count} task${count===1?'':'s'}? This cannot be undone.`:`Delete “${subject.name}”? This cannot be undone.`;
  if(!window.confirm(message)) return;
  if(cloudReady&&user){
   const taskDelete=await supabase.from('tasks').delete().eq('subject_id',subject.id);
   if(taskDelete.error){alert(`Could not delete the subject tasks. ${taskDelete.error.message}`);return}
   const sessionDelete=await supabase.from('study_sessions').delete().eq('subject_id',subject.id);
   if(sessionDelete.error){alert(`Could not delete the subject sessions. ${sessionDelete.error.message}`);return}
   const subjectDelete=await supabase.from('subjects').delete().eq('id',subject.id);
   if(subjectDelete.error){alert(`Could not delete subject. ${subjectDelete.error.message}`);return}
  }
  setTasks(x=>x.filter(t=>t.subject_id!==subject.id));
  setSessions(x=>x.filter(session=>session.subject_id!==subject.id));
  setSubjects(x=>x.filter(s=>s.id!==subject.id));
  setSelectedSubject(null);
 }
 async function logSession(minutes,subjectId,date){const mins=Math.max(1,Math.round(Number(minutes)||1));const row={user_id:user?.id,subject_id:subjectId||subjects[0]?.id,minutes:mins,session_date:date||localDateKey(new Date())};if(cloudReady&&user){const {data}=await supabase.from('study_sessions').insert(row).select().single();if(data)setSessions(x=>[data,...x])}else setSessions(x=>[{...row,id:uid()},...x]);setRunning(false);setSessionModal(false)}
 const done=tasks.filter(t=>t.status==='Done').length, progress=tasks.length?Math.round(done/tasks.length*100):0; const today=localDateKey(new Date()); const dueToday=tasks.filter(t=>t.due_date===today&&t.status!=='Done').length; const hours=Math.round((sessions.reduce((a,b)=>a+b.minutes,0)/60)*10)/10;
 const visibleTasks=tasks.filter(t=>(filter==='All'||t.status===filter||t.priority===filter)&&(`${t.title} ${t.notes} ${(t.tags||[]).join(' ')}`.toLowerCase().includes(search.toLowerCase()))).sort((a,b)=>{const ad=a.status==='Done',bd=b.status==='Done';if(ad!==bd)return ad?1:-1;return (a.due_date||'9999-12-31').localeCompare(b.due_date||'9999-12-31')});
 const subjectMap=Object.fromEntries(subjects.map(s=>[s.id,s]));
 const searchTerm=search.trim().toLowerCase();
 const searchResults=searchTerm?[
  ...tasks.filter(t=>`${t.title} ${t.notes||''} ${(t.tags||[]).join(' ')}`.toLowerCase().includes(searchTerm)).slice(0,8).map(t=>({type:'task',id:t.id,title:t.title,meta:subjectMap[t.subject_id]?.name||'Task',icon:CheckSquare})),
  ...subjects.filter(s=>`${s.name} ${s.code||''} ${s.category||''} ${s.notes||''}`.toLowerCase().includes(searchTerm)).slice(0,6).map(s=>({type:'subject',id:s.id,title:s.name,meta:s.category||'Subject',icon:BookOpen}))
 ].slice(0,8):[];
 const clearSearch=()=>setSearch('');
 const openSearchResult=(result)=>{
  if(result.type==='task'){setTab('Tasks');setFilter('All');}
  else {setTab('Subjects');setSelectedSubject(result.id);}
  clearSearch();
 };
 return <div className={'app density-'+density.toLowerCase()}><aside className={(mobile?'side open':'side')+(sidebarCollapsed?' collapsed':'')}><div className="brand"><div className="logo">✦</div><div className="brandCopy"><b>ORBIT Tracker</b><small>plan, organize, and get things done</small></div><button className="iconbtn close" onClick={()=>setMobile(false)} aria-label="Close sidebar"><X size={18}/></button></div><nav>{[['Dashboard',LayoutDashboard],['Tasks',CheckSquare],['Subjects',BookOpen],['Calendar',CalendarDays],['Focus',Timer]].map(([n,I])=><button className={tab===n?'nav active':'nav'} onClick={()=>{setTab(n);setMobile(false)}} key={n}><I size={18}/><span>{n}</span></button>)}<button className={tab==='Settings'?'nav active':'nav'} onClick={()=>{setTab('Settings');setMobile(false)}}><Settings size={18}/><span>Settings</span></button></nav><div className="sideBottom"><div className="quoteCard"><div className="quoteMark">“</div><p>Small steps, every day.</p><small>Progress is built one task at a time.</small><div className="onlineStatus"><span className="dot onlineDot"/><span>Online</span></div></div></div></aside><main><header><button className="iconbtn menu" onClick={()=>{if(window.innerWidth<=800){setMobile(true)}else{setSidebarCollapsed(v=>{const next=!v;localStorage.setItem('orbit_sidebar_collapsed',next?'1':'0');return next})}}} aria-label={sidebarCollapsed?"Expand sidebar":"Collapse sidebar"} title={sidebarCollapsed?"Expand sidebar":"Collapse sidebar"}><Menu/></button><div className="crumb">{tab}<span> / </span><b>{tab==='Dashboard'?'Today':'Workspace'}</b></div><div className="headActions"><div className={'search '+(searchTerm?'searchActive':'')}><Search size={17}/><input value={search} onFocus={()=>searchTerm&&setSearchOpen(true)} onChange={e=>{setSearch(e.target.value);setSearchOpen(true)}} onKeyDown={e=>{if(e.key==='Enter'&&searchResults[0])openSearchResult(searchResults[0]);if(e.key==='Escape'){clearSearch();setSearchOpen(false)}}} placeholder="Search tasks, notes, subjects..." aria-label="Search tasks, notes, and subjects"/><button type="button" className="searchClear" onClick={()=>{clearSearch();setSearchOpen(false)}} aria-label="Clear search" title="Clear search">{searchTerm?<X size={14}/>:null}</button>{searchTerm&&searchOpen&&<div className="searchResults" role="listbox" aria-label="Search results">{searchResults.length?searchResults.map(result=>{const Icon=result.icon;return <button type="button" className="searchResult" key={result.type+'-'+result.id} onClick={()=>openSearchResult(result)}><span className="searchResultIcon"><Icon size={15}/></span><span className="searchResultText"><b>{result.title}</b><small>{result.meta}</small></span><ArrowUpRight size={14}/></button>}):<div className="searchNoResults"><Search size={16}/><span>No matching tasks or subjects</span></div>}</div>}</div>{user?<div className="profile"><button onClick={()=>setProfileOpen(!profileOpen)} className="avatar">{(user.user_metadata?.full_name||user.email||user.phone||'U')[0].toUpperCase()}</button>{profileOpen&&<div className="profileMenu"><b>{user.user_metadata?.full_name||'User'}</b><small>{user.email||user.phone}</small><button onClick={logout}><LogOut size={15}/> Sign out</button></div>}</div>:<button className="google" onClick={login}>Sign in</button>}</div></header>{tab==='Dashboard'&&<Dashboard progress={progress} dueToday={dueToday} hours={hours} tasks={tasks} subjects={subjects} subjectMap={subjectMap} toggleTask={toggleTask} updateTask={updateTask} setTab={setTab} setModal={setModal}/>} {tab==='Tasks'&&<Tasks tasks={visibleTasks} subjectMap={subjectMap} toggleTask={toggleTask} deleteTask={deleteTask} setModal={setModal} filter={filter} setFilter={setFilter}/>} {tab==='Subjects'&&(selectedSubject?<SubjectDetail subject={subjects.find(s=>s.id===selectedSubject)} tasks={tasks} setTasks={setTasks} subjects={subjects} setSubjects={setSubjects} setSelectedSubject={setSelectedSubject} setModal={setModal} cloudReady={cloudReady} user={user} deleteTask={deleteTask} deleteSubject={deleteSubject} onEditSubject={setSubjectEdit}/>:<Subjects subjects={subjects} tasks={tasks} setModal={setModal} onSelect={setSelectedSubject}/>)} {tab==='Calendar'&&<Calendar tasks={tasks} subjectMap={subjectMap} setModal={setModal}/>} {tab==='Focus'&&<Focus timer={timer} running={running} setRunning={setRunning} setTimer={setTimer} onLogSession={()=>setSessionModal(true)} focusMode={focusMode} setFocusMode={setFocusMode} pomodoros={pomodoros} setPomodoros={setPomodoros} customMinutes={customMinutes} setCustomMinutes={setCustomMinutes}/>}  {tab==='Settings'&&<SettingsPage theme={theme} setTheme={setTheme} user={user} login={login} logout={logout} onOpen={setSettingsPanel}/>} {settingsPanel&&<SettingsDetail type={settingsPanel} theme={theme} setTheme={setTheme} density={density} setDensity={setDensity} user={user} login={login} logout={logout} onFocusLengthChange={m=>{setRunning(false);setFocusMode('custom');setCustomMinutes(m);setTimer(m*60)}} onClearLocalData={()=>{if(!window.confirm('Clear all local tasks, subjects, and sessions? This cannot be undone.'))return;localStorage.removeItem('orbit_subjects');localStorage.removeItem('orbit_tasks');localStorage.removeItem('orbit_sessions');setSubjects([]);setTasks([]);setSessions([]);setSelectedSubject(null);}} onClose={()=>setSettingsPanel(null)}/>} </main>{(modal==='task'||(modal?.type==='task'))&&<TaskModal subjects={subjects} initialDate={modal?.dueDate||''} initialTask={modal?.task||null} onClose={()=>setModal(null)} onSave={saveTask}/>} {modal==='subject'&&<SubjectModal onClose={()=>setModal(null)} onSave={saveSubject}/>} {subjectEdit&&<SubjectEditModal subject={subjectEdit} onClose={()=>setSubjectEdit(null)} onSave={v=>updateSubject(subjectEdit,v)}/>} {sessionModal&&<SessionModal subjects={subjects} defaultMinutes={Math.max(1,Math.round(timer/60))} onClose={()=>setSessionModal(false)} onSave={logSession}/>} {authModal&&<AuthModal cloudReady={cloudReady} onClose={()=>setAuthModal(false)} onGoogle={loginGoogle} onSendOtp={loginPhone} onVerifyOtp={verifyPhone}/>}</div>
}
function Dropdown({value,onChange,options,ariaLabel='Select option',className='',optionLabels={},onDeleteOption}){
 const [open,setOpen]=useState(false); const ref=useRef(null);
 useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false)};document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h)},[]);
 return <div className={'dropdown '+className+(open?' dropdownOpen':'')} ref={ref}>
  <button type="button" className={'dropdownTrigger '+(open?'open':'')} onClick={()=>setOpen(v=>!v)} aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel}>
   <span>{optionLabels[value]||value}</span><ChevronDown size={18} className="dropdownChevron"/>
  </button>
  {open&&<div className="dropdownMenu" role="listbox">
   {options.map(option=>{const active=option===value;const deletable=onDeleteOption?.canDelete?.(option);return deletable?<div className="dropdownOptionRow" key={option}>
    <button type="button" role="option" aria-selected={active} className={'dropdownOption '+(active?'selected':'')} onClick={()=>{onChange(option);setOpen(false)}}><span>{optionLabels[option]||option}</span>{active&&<Check size={16}/>}</button>
    <button type="button" className="dropdownOptionDelete" aria-label={'Remove '+(optionLabels[option]||option)} title={'Remove '+(optionLabels[option]||option)} onClick={e=>{e.stopPropagation();onDeleteOption.remove(option)}}><X size={14}/></button>
   </div>:<button type="button" role="option" aria-selected={active} className={'dropdownOption '+(active?'selected':'')} key={option} onClick={()=>{onChange(option);setOpen(false)}}><span>{optionLabels[option]||option}</span>{active&&<Check size={16}/>}</button>})}
  </div>}
 </div>
}
function CategoryPicker({value,onChange}){
 const defaults=['Work','Personal','Learning','Health','Other'];
 const [categories,setCategories]=useState(()=>{try{return Array.from(new Set([...defaults,...JSON.parse(localStorage.getItem('orbit_categories')||'[]')]))}catch{return defaults}});
 const [adding,setAdding]=useState(false);
 const [custom,setCustom]=useState('');
 const addCategory=()=>{const name=custom.trim().replace(/\s+/g,' ');if(!name)return;const next=Array.from(new Set([...categories,name]));setCategories(next);localStorage.setItem('orbit_categories',JSON.stringify(next.filter(x=>!defaults.includes(x))));onChange(name);setCustom('');setAdding(false)};
 const removeCategory=(name)=>{if(defaults.includes(name))return;const next=categories.filter(x=>x!==name);setCategories(next);localStorage.setItem('orbit_categories',JSON.stringify(next.filter(x=>!defaults.includes(x))));if(value===name)onChange('Other')};
 const options=[...categories,'__add__'];
 return <div className="categoryPicker">
  <Dropdown value={value} onChange={v=>v==='__add__'?setAdding(true):onChange(v)} options={options} optionLabels={{'__add__':'+ Add custom category'}} ariaLabel="Select category" className="formDropdown" onDeleteOption={{canDelete:option=>option!=='__add__'&&!defaults.includes(option),remove:removeCategory}}/>
  {adding&&<div className="customCategoryEditor">
   <div className="customCategoryRow"><input autoFocus value={custom} onChange={e=>setCustom(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')addCategory();if(e.key==='Escape'){setAdding(false);setCustom('')}}} placeholder="e.g. Freelance" aria-label="Custom category name"/><button type="button" className="secondary" onClick={addCategory} disabled={!custom.trim()}>Add</button></div>
   <button type="button" className="customCategoryCancel" onClick={()=>{setAdding(false);setCustom('')}}>Cancel</button>
  </div>}
 </div>
}
function SettingsPage({theme,setTheme,user,login,logout,onOpen}){
 const themes=[['dark','Dark',Moon,'Deep and easy on the eyes'],['light','Light',Sun,'Bright and clean for daytime'],['system','System',Monitor,'Follow your device preference']];
 const settingRows=[
  ['Account',CircleUser,'Manage your profile and sign-in preferences'],
  ['Appearance',Palette,'Theme, interface density and visual style'],
  ['Notifications',Bell,'Task reminders, deadlines and useful nudges'],
  ['Focus preferences',SlidersHorizontal,'Default focus length and planning preferences'],
  ['Privacy & sync',ShieldCheck,'Cloud sync, local storage and data controls'],
 ];
 return <section className="page settingsPage">
  <div className="sectionTop"><div><span className="eyebrow">WORKSPACE CONTROL</span><h1>Settings</h1><p>Shape Orbit around the way you actually work.</p></div></div>
  <div className="settingsGrid">
   <div className="panel settingsPanel"><div className="panelHead"><div><span className="eyebrow">APPEARANCE</span><h2>Theme</h2></div><Palette size={19}/></div><p className="settingsHint">Choose how Orbit looks. Your choice is saved on this device.</p><div className="themeChoices">{themes.map(([id,label,Icon,desc])=><button key={id} className={'themeChoice '+(theme===id?'selected':'')} onClick={()=>setTheme(id)}><div className="themeIcon"><Icon size={18}/></div><div><b>{label}</b><small>{desc}</small></div><span className="radio">{theme===id?'✓':''}</span></button>)}</div></div>
   <div className="panel settingsPanel"><div className="panelHead"><div><span className="eyebrow">PREFERENCES</span><h2>Settings</h2></div><Settings size={19}/></div><div className="settingsList">{settingRows.map(([label,Icon,desc])=><button type="button" key={label} className="settingRow" onClick={()=>onOpen(label)}><div className="settingIcon"><Icon size={17}/></div><div><b>{label}</b><small>{desc}</small></div><ArrowUpRight size={15}/></button>)}</div></div>
  </div>
 </section>
}

function SettingsDetail({type,theme,setTheme,density,setDensity,user,login,logout,onClose,onFocusLengthChange,onClearLocalData}){
 const [notifications,setNotifications]=useState(()=>localStorage.getItem('orbit_notifications')!=='off');
 const [sound,setSound]=useState(()=>localStorage.getItem('orbit_focus_sound')!=='off');
 const [focusLength,setFocusLength]=useState(()=>Number(localStorage.getItem('orbit_default_focus')||25));
 const save=(key,val)=>localStorage.setItem(key,val);
 const title=type;
 return <div className="overlay settingsOverlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}} ><div className="modal settingsDetail" onMouseDown={e=>e.stopPropagation()}>
  <div className="modalHead"><div><span className="eyebrow">SETTINGS</span><h2>{title}</h2></div><button className="iconbtn" onClick={onClose}><X/></button></div>
  {type==='Account'&&<div className="detailSettingsContent">{user?<><div className="accountCard"><div className="accountAvatar">{(user.user_metadata?.full_name||user.email||'U')[0].toUpperCase()}</div><div><b>{user.user_metadata?.full_name||'User'}</b><small>{user.email}</small></div></div><button className="secondary full" onClick={logout}><LogOut size={16}/> Sign out</button></>:<><div className="accountCard"><div className="accountAvatar"><CircleUser/></div><div><b>Not signed in</b><small>Sign in to sync your workspace across devices.</small></div></div><button type="button" className="primary full" onMouseDown={e=>e.stopPropagation()} onClick={login}>Sign in</button></>}</div>}
  {type==='Appearance'&&<div className="detailSettingsContent"><div className="detailSection"><b>Theme</b><small>Choose the interface style used across Orbit.</small><div className="detailChoices">{[['dark','Dark',Moon],['light','Light',Sun],['system','System',Monitor]].map(([id,label,Icon])=><button type="button" className={'detailChoice '+(theme===id?'selected':'')} onClick={()=>setTheme(id)} key={id}><Icon size={16}/><span>{label}</span>{theme===id&&<Check size={15}/>}</button>)}</div></div><div className="detailSection"><b>Interface density</b><small>Control how spacious lists and cards feel.</small><div className="detailChoices">{['Compact','Comfortable','Spacious'].map(x=><button type="button" className={'detailChoice '+(density===x?'selected':'')} onClick={()=>{setDensity(x);save('orbit_density',x)}} key={x}><span>{x}</span>{density===x&&<Check size={15}/>}</button>)}</div></div></div>}
  {type==='Notifications'&&<div className="detailSettingsContent"><ToggleRow label="Task reminders" desc="Allow Orbit to surface reminders for upcoming work." checked={notifications} onChange={v=>{setNotifications(v);save('orbit_notifications',v?'on':'off')}}/><div className="detailDivider"/><ToggleRow label="Focus sounds" desc="Use a sound cue when a focus session finishes." checked={sound} onChange={v=>{setSound(v);save('orbit_focus_sound',v?'on':'off')}}/></div>}
  {type==='Focus preferences'&&<div className="detailSettingsContent"><div className="detailSection"><b>Default focus length</b><small>This duration will be used when you open Focus.</small><div className="focusLengthGrid">{[15,25,45,60].map(m=><button type="button" className={'detailChoice '+(focusLength===m?'selected':'')} onClick={()=>{setFocusLength(m);save('orbit_default_focus',m);onFocusLengthChange?.(m)}} key={m}><span>{m} min</span>{focusLength===m&&<Check size={15}/>}</button>)}</div></div></div>}
  {type==='Privacy & sync'&&<div className="detailSettingsContent"><div className="infoBox"><ShieldCheck size={18}/><div><b>Local data</b><small>Your tasks, subjects and preferences remain in this browser unless you connect cloud sync.</small></div></div><div className="infoBox"><div className="dot onlineDot"/><div><b>Connection</b><small>{user?'Signed in and ready for cloud sync.':'Using local workspace mode.'}</small></div></div><button type="button" className="secondary full" onClick={onClearLocalData}>Clear local workspace data</button></div>}
 </div></div>
}

function ToggleRow({label,desc,checked,onChange}){return <div className="toggleRow"><div><b>{label}</b><small>{desc}</small></div><button type="button" className={'switch '+(checked?'on':'')} aria-pressed={checked} onClick={()=>onChange(!checked)}><span/></button></div>}

function Empty({text}){return <div className="empty">{text}</div>}
function DateField({value,onChange,label='Deadline',compact=false,onCancel}){
 const [open,setOpen]=useState(false);
 const [cursor,setCursor]=useState(()=>{const d=value?new Date(value+'T00:00:00'):new Date();d.setDate(1);return d});
 const ref=useRef(null);
 useEffect(()=>{if(value){const d=new Date(value+'T00:00:00');d.setDate(1);setCursor(d)}},[value]);
 useEffect(()=>{const close=e=>{if(ref.current&&!ref.current.contains(e.target)){setOpen(false);onCancel?.()}};document.addEventListener('mousedown',close);return()=>document.removeEventListener('mousedown',close)},[]);
 const selected=value?new Date(value+'T00:00:00'):null;
 const pretty=value?new Date(value+'T00:00:00').toLocaleDateString(undefined,{day:'2-digit',month:'short',year:'numeric'}):'Select a date';
 const monthLabel=cursor.toLocaleDateString(undefined,{month:'long',year:'numeric'});
 const firstDay=new Date(cursor.getFullYear(),cursor.getMonth(),1).getDay();
 const daysInMonth=new Date(cursor.getFullYear(),cursor.getMonth()+1,0).getDate();
 const cells=Array.from({length:firstDay+daysInMonth},(_,i)=>i<firstDay?null:i-firstDay+1);
 const pick=(d)=>{onChange(localDateKey(d));setOpen(false)};
 const shiftMonth=n=>setCursor(d=>new Date(d.getFullYear(),d.getMonth()+n,1));
 const today=new Date();today.setHours(0,0,0,0);
 const isSame=(a,b)=>a&&b&&a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
 return <div className={'dateField '+(compact?'dateFieldCompact':'')} ref={ref}>
  <button type="button" className={'dateFieldButton '+(!value?'placeholder':'')+(open?' open':'')} onClick={()=>setOpen(v=>!v)} aria-expanded={open} aria-haspopup="dialog" aria-label={`${label}: ${pretty}`}>
   <span className="dateValue"><small>{value?'DATE':'DEADLINE'}</small>{pretty}</span>
   <span className="dateIconWrap" aria-hidden="true"><CalendarDays size={17}/></span>
  </button>
  {open&&<div className="datePicker" role="dialog" aria-label="Choose date">
   <div className="dateQuick"><button type="button" onClick={()=>pick(today)}>Today</button><button type="button" onClick={()=>{const d=new Date(today);d.setDate(d.getDate()+1);pick(d)}}>Tomorrow</button><button type="button" onClick={()=>{const d=new Date(today);d.setDate(d.getDate()+7);pick(d)}}>Next week</button></div>
   <div className="datePickerHead"><button type="button" className="dateNav" onClick={()=>shiftMonth(-1)} aria-label="Previous month">‹</button><b>{monthLabel}</b><button type="button" className="dateNav" onClick={()=>shiftMonth(1)} aria-label="Next month">›</button></div>
   <div className="dateWeek"><span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span></div>
   <div className="dateGrid">{cells.map((day,i)=>day===null?<span className="dateBlank" key={'blank-'+i}/>:<button type="button" key={day} className={'dateCell '+(selected&&selected.getFullYear()===cursor.getFullYear()&&selected.getMonth()===cursor.getMonth()&&selected.getDate()===day?'selected':'')+((today.getFullYear()===cursor.getFullYear()&&today.getMonth()===cursor.getMonth()&&today.getDate()===day)?' today':'')} onClick={()=>pick(new Date(cursor.getFullYear(),cursor.getMonth(),day))}>{day}</button>)}</div>
   {value&&<button type="button" className="dateClear" onClick={()=>{onChange('');setOpen(false)}}>Clear date</button>}
  </div>}
 </div>
}
function TaskModal({subjects,initialDate='',initialTask=null,onClose,onSave}){const [v,setV]=useState(()=>initialTask?{...initialTask}:{title:'',subject_id:subjects[0]?.id||'',due_date:initialDate,priority:'Medium',status:'Todo',estimated_minutes:30,notes:'',tags:[]});const editing=Boolean(initialTask?.id);return <Modal title={editing?'Edit task':'New task'} onClose={onClose}><label>Task title<input autoFocus value={v.title} onChange={e=>setV({...v,title:e.target.value})} placeholder="e.g. Finish the first draft"/></label><div className="formGrid"><label>Subject<Dropdown value={subjects.find(s=>s.id===v.subject_id)?.name||'Select subject'} onChange={name=>{const s=subjects.find(x=>x.name===name);setV({...v,subject_id:s?.id||''})}} options={subjects.map(s=>s.name)} ariaLabel="Select subject" className="formDropdown"/></label><label>Deadline<DateField value={v.due_date} onChange={due_date=>setV({...v,due_date})}/></label><label>Priority<Dropdown value={v.priority} onChange={priority=>setV({...v,priority})} options={['Low','Medium','High','Urgent']} ariaLabel="Select priority" className="formDropdown"/></label><label>Minutes<input type="number" min="5" value={v.estimated_minutes} onChange={e=>setV({...v,estimated_minutes:+e.target.value})}/></label></div><label>Description<textarea value={v.notes} onChange={e=>setV({...v,notes:e.target.value})} placeholder="Add details, context, links, or anything useful for this task..."/></label><button className="primary full" disabled={!v.title.trim()} onClick={()=>onSave(v)}>{editing?'Save changes':'Create task'}</button></Modal>}

function SessionModal({subjects,defaultMinutes,onClose,onSave}){
 const [minutes,setMinutes]=useState(defaultMinutes||25);
 const [subjectId,setSubjectId]=useState(subjects[0]?.id||'');
 const [date,setDate]=useState(localDateKey(new Date()));
 return <Modal title="Log a focus session" onClose={onClose}>
  <p className="modalIntro">Record time you already spent focusing. It will be added to your activity total.</p>
  <div className="formGrid">
   <label>Duration (minutes)<input autoFocus type="number" min="1" max="600" value={minutes} onChange={e=>setMinutes(e.target.value)}/></label>
   <label>Date<DateField value={date} onChange={setDate}/></label>
   <label>Subject<Dropdown value={subjects.find(s=>s.id===subjectId)?.name||'Select subject'} onChange={name=>setSubjectId(subjects.find(s=>s.name===name)?.id||'')} options={subjects.map(s=>s.name)} ariaLabel="Select subject" className="formDropdown"/></label>
  </div>
  <button type="button" className="primary full" disabled={!Number(minutes)||Number(minutes)<1||!date} onClick={()=>onSave(minutes,subjectId,date)}>Save session</button>
 </Modal>
}

function AuthModal({cloudReady,onClose,onGoogle,onSendOtp,onVerifyOtp}){
 const [mode,setMode]=useState('choose'); const [phone,setPhone]=useState(''); const [token,setToken]=useState(''); const [sent,setSent]=useState(false); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
 const normalizePhone=v=>v.replace(/[^\d+]/g,'');
 async function send(){setError('');const value=normalizePhone(phone);if(!/^\+[1-9]\d{7,14}$/.test(value)){setError('Enter your phone number with country code, e.g. +91 9876543210.');return}setBusy(true);try{await onSendOtp(value);setPhone(value);setSent(true)}catch(e){setError(e.message||'Could not send OTP.')}finally{setBusy(false)}}
 async function verify(){setError('');if(!/^\d{4,8}$/.test(token.trim())){setError('Enter the OTP you received.');return}setBusy(true);try{await onVerifyOtp(phone,token.trim())}catch(e){setError(e.message||'Could not verify OTP.')}finally{setBusy(false)}}
 return <div className="overlay authOverlay" onMouseDown={onClose}><div className="modal authModal" onMouseDown={e=>e.stopPropagation()}>
  <div className="modalHead"><div><span className="eyebrow">ORBIT ACCOUNT</span><h2>Sign in to Orbit</h2></div><button className="iconbtn" onClick={onClose} aria-label="Close sign in"><X/></button></div>
  {!cloudReady&&<div className="authNotice">Cloud sign-in is not configured yet. Add your Supabase URL and anon key to enable Google and phone OTP.</div>}
  {mode==='choose'&&<div className="authChoices">
   <button className="authMethod googleMethod" disabled={!cloudReady||busy} onClick={onGoogle}><span className="googleMark">G</span><span><b>Google</b><small>Fast, secure sign in</small></span><ArrowUpRight size={15}/></button>
   <div className="authDivider"><span>or</span></div>
   <button className="authMethod" disabled={!cloudReady} onClick={()=>setMode('phone')}><span className="methodIcon">+1</span><span><b>Use phone number</b><small>Get a one-time verification code</small></span><ArrowUpRight size={15}/></button>
  </div>}
  {mode==='phone'&&<div className="authPhoneForm">
   <button className="authBack" type="button" onClick={()=>{setMode('choose');setSent(false);setError('')}}>← Back to sign-in options</button>
   {!sent?<><label>Phone number<input autoFocus inputMode="tel" value={phone} onChange={e=>setPhone(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')send()}} placeholder="+91 9876543210"/></label><button className="primary full" disabled={!cloudReady||busy} onClick={send}>{busy?'Sending code…':'Send OTP'}</button></>:<><label>Verification code<input autoFocus inputMode="numeric" maxLength="8" value={token} onChange={e=>setToken(e.target.value.replace(/\D/g,''))} onKeyDown={e=>{if(e.key==='Enter')verify()}} placeholder="Enter OTP"/></label><button className="primary full" disabled={busy} onClick={verify}>{busy?'Verifying…':'Verify & sign in'}</button><button className="secondary full resend" disabled={busy} onClick={send}>Send a new code</button></>}
   {error&&<div className="authError">{error}</div>}
   <small className="authFinePrint">By continuing, you agree to use this number for Orbit account verification.</small>
  </div>}
 </div></div>
}

function SubjectEditModal({subject,onClose,onSave}){const [v,setV]=useState({name:subject?.name||'',code:subject?.code||'',category:subject?.category||'Work',color:subject?.color||'#8b5cf6',target_hours:subject?.target_hours||0,notes:subject?.notes||''});return <Modal title="Edit subject" onClose={onClose}><label>Subject name<input autoFocus value={v.name} onChange={e=>setV({...v,name:e.target.value})} placeholder="e.g. Product Design"/></label><div className="formGrid"><label>Category<CategoryPicker value={v.category} onChange={category=>setV({...v,category})}/></label><label>Code<input value={v.code} onChange={e=>setV({...v,code:e.target.value})} placeholder="CS / IT"/></label><label>Target hours<input type="number" min="0" value={v.target_hours} onChange={e=>setV({...v,target_hours:+e.target.value})}/></label><label>Accent<input type="color" value={v.color} onChange={e=>setV({...v,color:e.target.value})}/></label></div><label>Description<textarea value={v.notes} onChange={e=>setV({...v,notes:e.target.value})} placeholder="Describe this subject, project, goal, or anything useful to remember..."/></label><div className="editSubjectHint"><span>Changes update this subject without affecting its tasks or PDF notes.</span></div><button className="primary full" disabled={!v.name.trim()} onClick={()=>onSave(v)}>Save changes</button></Modal>}

function SubjectModal({onClose,onSave}){const [v,setV]=useState({name:'',code:'',category:'Work',color:'#8b5cf6',target_hours:20,notes:''});return <Modal title="Add subject" onClose={onClose}><label>Subject name<input autoFocus value={v.name} onChange={e=>setV({...v,name:e.target.value})} placeholder="e.g. Product Design"/></label><div className="formGrid"><label>Category<CategoryPicker value={v.category} onChange={category=>setV({...v,category})}/></label><label>Code<input value={v.code} onChange={e=>setV({...v,code:e.target.value})} placeholder="CS / IT"/></label><label>Target hours<input type="number" min="0" value={v.target_hours} onChange={e=>setV({...v,target_hours:+e.target.value})}/></label><label>Accent<input type="color" value={v.color} onChange={e=>setV({...v,color:e.target.value})}/></label></div><label>Description<textarea value={v.notes} onChange={e=>setV({...v,notes:e.target.value})} placeholder="Describe this subject, project, goal, or anything useful to remember..."/></label><button className="primary full" disabled={!v.name.trim()} onClick={()=>onSave(v)}>Create subject</button></Modal>}
function Stat({icon:Icon,label,value,sub,onClick,accent='purple',detail}){return <button type="button" className={'stat statClickable '+accent} onClick={onClick} aria-label={`${label}: ${value}. ${sub}`}><div className="statTop"><div className="statIcon"><Icon size={19}/></div><span className="statArrow"><ArrowUpRight size={15}/></span></div><div className="statBody"><small>{label}</small><strong>{value}</strong><span>{sub}</span></div>{detail&&<span className="statDetail">{detail}</span>}</button>}
function Dashboard(p){const upcoming=p.tasks.filter(t=>t.status!=='Done').sort((a,b)=>(a.due_date||'9').localeCompare(b.due_date||'9')).slice(0,5);return <section className="page"><div className="hero"><div><span className="eyebrow">{formatDashboardDate()}</span><h1>Make progress, <em>not pressure.</em></h1><p>Your tasks, projects, and plans, in one calm workspace.</p></div><button className="primary" onClick={()=>p.setModal('task')}><Plus size={18}/> Add task</button></div><div className="stats"><Stat icon={Target} label="Overall progress" value={p.progress+'%'} sub="across your tasks" detail={`${p.tasks.filter(t=>t.status==='Done').length} completed`} onClick={()=>p.setTab('Tasks')} accent="purple"/><Stat icon={Clock3} label="Time logged" value={p.hours+'h'} sub="all-time sessions" detail="Open focus timer" onClick={()=>p.setTab('Focus')} accent="cyan"/><Stat icon={CheckSquare} label="Due today" value={p.dueToday} sub="tasks to finish" detail={p.dueToday?'Needs attention':'All clear today'} onClick={()=>p.setTab('Calendar')} accent="green"/><Stat icon={Flame} label="Momentum" value={p.progress>70?'Strong':'Building'} sub="keep the streak alive" detail="Keep moving forward" onClick={()=>p.setTab('Focus')} accent="orange"/></div><div className="grid2"><div className="panel"><div className="panelHead"><div><span className="eyebrow">UP NEXT</span><h2>Your priority queue</h2></div><button className="textBtn" onClick={()=>p.setTab('Tasks')}>View all <ArrowUpRight size={15}/></button></div>{upcoming.length?<div className="taskList">{upcoming.map(t=><TaskRow key={t.id} t={t} subject={p.subjectMap[t.subject_id]} subjects={p.subjects} toggle={p.toggleTask} updateTask={p.updateTask}/>)}</div>:<Empty text="You're all caught up. ✨"/>}</div><div className="panel"><div className="panelHead"><div><span className="eyebrow">SUBJECT PULSE</span><h2>Where your time goes</h2></div><button className="textBtn" onClick={()=>p.setModal('subject')}><Plus size={15}/> Subject</button></div><div className="subjectBars">{p.subjects.slice(0,5).map(s=>{const total=p.tasks.filter(t=>t.subject_id===s.id).length;const d=p.tasks.filter(t=>t.subject_id===s.id&&t.status==='Done').length;return <div className="barRow" key={s.id}><div className="barLabel"><span className="subjectDot" style={{background:s.color}}/><b>{s.name}</b><span>{d}/{total}</span></div><div className="bar"><i style={{width:`${total?d/total*100:0}%`,background:s.color}}/></div></div>})}</div></div></div></section>}
function InlineEdit({children,className='',onEdit,title}){return <button type="button" className={'inlineEdit '+className} onClick={onEdit} title={title}>{children}</button>}
function TaskRow({t,subject,toggle,updateTask,subjects=[]}){
 const [editing,setEditing]=useState(null);
 const [value,setValue]=useState('');
 const begin=(type,v)=>{setEditing(type);setValue(v??'')};
 const save=(type,v=value)=>{if(type==='date') updateTask(t,{due_date:v||''}); if(type==='minutes') updateTask(t,{estimated_minutes:Math.max(1,Number(v)||1)}); setEditing(null)};
 return <div className={'taskRow '+(t.status==='Done'?'taskCompleted':'')}><button className={t.status==='Done'?'check done':'check'} onClick={()=>toggle(t)} aria-label={t.status==='Done'?'Mark task incomplete':'Mark task complete'}>{t.status==='Done'&&<Check size={14}/>}</button><div className="taskInfo"><b>{t.title}</b><div>
 {editing==='subject'?<Dropdown value={subject?.name||'Unassigned'} onChange={name=>{const s=subjects.find(x=>x.name===name);updateTask(t,{subject_id:s?.id||null});setEditing(null)}} options={subjects.map(s=>s.name)} ariaLabel="Edit task subject" className="inlineDropdown"/>:<InlineEdit className="taskPillButton" title="Click to edit subject" onEdit={()=>begin('subject',subject?.name||'') }><span className="pill" style={{borderColor:subject?.color,color:subject?.color}}>{subject?.name||'Unassigned'}</span></InlineEdit>}
 {editing==='date'?<DateField value={value} onChange={next=>{save('date',next)}} label="Deadline" compact onCancel={()=>setEditing(null)}/>:<InlineEdit className="metaEdit" title="Click to edit deadline" onEdit={()=>begin('date',t.due_date||'')}><span>{t.due_date||'No deadline'}</span></InlineEdit>}
 {editing==='minutes'?<input autoFocus className="inlineField minutesEdit" type="number" min={1} value={value} onChange={e=>setValue(e.target.value)} onBlur={()=>save('minutes')} onKeyDown={e=>{if(e.key==='Enter')save('minutes');if(e.key==='Escape')setEditing(null)}}/>:<InlineEdit className="metaEdit" title="Click to edit estimated time" onEdit={()=>begin('minutes',t.estimated_minutes||1)}><span>{t.estimated_minutes||0}m</span></InlineEdit>}
 </div></div>
 {editing==='priority'?<Dropdown value={t.priority} onChange={priority=>{updateTask(t,{priority});setEditing(null)}} options={['Low','Medium','High','Urgent']} ariaLabel="Edit task priority" className="inlinePriority"/>:<InlineEdit className={'priority '+t.priority.toLowerCase()} title="Click to edit priority" onEdit={()=>begin('priority',t.priority)}>{t.priority}</InlineEdit>}
 </div>}
function Tasks({tasks,subjectMap,toggleTask,deleteTask,setModal,filter,setFilter}){const priorityFilter=['All','High','Urgent'].includes(filter)?filter:'All';const orderedTasks=[...tasks].sort((a,b)=>{const ad=a.status==='Done',bd=b.status==='Done';if(ad!==bd)return ad?1:-1;return (a.due_date||'9999-12-31').localeCompare(b.due_date||'9999-12-31')});return <section className="page"><div className="sectionTop"><div><span className="eyebrow">WORK QUEUE</span><h1>Tasks</h1><p>Break big goals into small, finishable moves.</p></div><button className="primary" onClick={()=>setModal('task')}><Plus size={18}/> New task</button></div><div className="filters"><div className="seg">{['All','Todo','In Progress','Done'].map(x=><button className={filter===x?'selected':''} onClick={()=>setFilter(x)} key={x}>{x}</button>)}</div><Dropdown value={priorityFilter} onChange={setFilter} options={['All','High','Urgent']} ariaLabel="Filter tasks by priority" className="priorityDropdown"/></div><div className="panel tablePanel">{orderedTasks.length?orderedTasks.map(t=><div className={'taskRow detailed '+(t.status==='Done'?'taskCompleted':'')} key={t.id}><button className={t.status==='Done'?'check done':'check'} onClick={()=>toggleTask(t)} aria-label={t.status==='Done'?'Mark task incomplete':'Mark task complete'}>{t.status==='Done'&&<Check size={14}/>}</button><div className="taskInfo"><b>{t.title}</b><div><span className="pill" style={{borderColor:subjectMap[t.subject_id]?.color,color:subjectMap[t.subject_id]?.color}}>{subjectMap[t.subject_id]?.name||'Unassigned'}</span>{(t.tags||[]).map(x=><span key={x}>#{x}</span>)}<span>{t.due_date||'No deadline'}</span></div>{t.notes&&<p className="taskNotesPreview">{t.notes}</p>}</div><span className={'priority '+t.priority.toLowerCase()}>{t.priority}</span><div className="taskActions"><button type="button" className="iconbtn" onClick={()=>setModal({type:'task',task:t})} aria-label={`Edit ${t.title}`} title="Edit task"><Pencil size={15}/></button><button type="button" className="iconbtn dangerIcon" onClick={()=>deleteTask(t)} aria-label={`Delete ${t.title}`} title="Delete task"><Trash2 size={15}/></button></div></div>):<Empty text="No tasks yet. Add your first task."/>}</div></section>}
function Subjects({subjects,tasks,setModal,onSelect}){return <section className="page"><div className="sectionTop"><div><span className="eyebrow">YOUR ORGANIZATION</span><h1>Subjects</h1><p>Organize the areas of your life and keep the big picture in view.</p></div><button className="primary" onClick={()=>setModal('subject')}><Plus size={18}/> Add subject</button></div><div className="subjectGrid">{subjects.map(s=>{const total=tasks.filter(t=>t.subject_id===s.id).length,done=tasks.filter(t=>t.subject_id===s.id&&t.status==='Done').length;return <button className="subjectCard clickableSubject" key={s.id} onClick={()=>onSelect(s.id)}><div className="subjectAccent" style={{background:s.color}}/><div className="subjectTop"><div className="bigIcon" style={{background:s.color+'22',color:s.color}}><BookOpen size={22}/></div><span className="category">{s.category}</span></div><h3>{s.name}</h3><small>{s.code||'CUSTOM'} · {s.target_hours||0} target hours</small><div className="subjectProgress"><span>{done}/{total} tasks complete</span><b>{total?Math.round(done/total*100):0}%</b></div><div className="bar"><i style={{width:`${total?done/total*100:0}%`,background:s.color}}/></div><span className="subjectOpenHint">Open subject <ArrowUpRight size={13}/></span></button>})}<button className="addCard" onClick={()=>setModal('subject')}><Plus/> <b>Add another subject</b><span>Work, personal, learning, or anything else</span></button></div></section>}

function SubjectDetail({subject,tasks,setTasks,subjects,setSubjects,setSelectedSubject,setModal,cloudReady,user,deleteTask,deleteSubject,onEditSubject}){
 const [section,setSection]=useState('tasks');
 const [description,setDescription]=useState(subject?.notes||'');
 const [pdfs,setPdfs]=useState([]);
 const [pdfBusy,setPdfBusy]=useState(false);
 const fileInputRef=useRef(null);
 useEffect(()=>{setDescription(subject?.notes||'');setSection('tasks');loadPdfs()},[subject?.id]);
 async function loadPdfs(){if(!subject)return;try{setPdfs(await listSubjectPdfs(subject.id))}catch{setPdfs([])}}
 if(!subject) return null;
 const subjectTasks=tasks.filter(t=>t.subject_id===subject.id).sort((a,b)=>{const ad=a.status==='Done',bd=b.status==='Done';if(ad!==bd)return ad?1:-1;return (a.due_date||'9999').localeCompare(b.due_date||'9999')});
 const completed=subjectTasks.filter(t=>t.status==='Done').length;
 const progress=subjectTasks.length?Math.round(completed/subjectTasks.length*100):0;
 async function toggle(t){const status=t.status==='Done'?'Todo':'Done';if(cloudReady&&user)await supabase.from('tasks').update({status,completed_at:status==='Done'?new Date().toISOString():null}).eq('id',t.id);setTasks(x=>x.map(a=>a.id===t.id?{...a,status}:a))}
 async function saveDescription(){
  if(cloudReady&&user)await supabase.from('subjects').update({notes:description}).eq('id',subject.id);
  setSubjects(x=>x.map(s=>s.id===subject.id?{...s,notes:description}:s));
  setSection('description');
}
 async function uploadPdfs(e){const files=[...(e.target.files||[])].filter(f=>f.type==='application/pdf'||f.name.toLowerCase().endsWith('.pdf'));if(!files.length)return;setPdfBusy(true);try{for(const file of files)await saveSubjectPdf(subject.id,file);await loadPdfs()}catch(err){alert(`Could not save PDF${files.length>1?'s':''}. ${err?.message||''}`)}finally{setPdfBusy(false);e.target.value=''}}
 async function openPdf(id,download=false){const row=await readSubjectPdf(id);if(!row?.blob)return;const url=URL.createObjectURL(row.blob);if(download){const a=document.createElement('a');a.href=url;a.download=row.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}else{window.open(url,'_blank','noopener,noreferrer');setTimeout(()=>URL.revokeObjectURL(url),60000)}}
 async function removePdf(id){if(!confirm('Remove this PDF from the subject?'))return;await deleteSubjectPdf(id);await loadPdfs()}
 return <section className="page subjectDetailPage">
   <button className="backBtn" onClick={()=>setSelectedSubject(null)}>← Back to subjects</button>
   <div className="detailHero"><div><span className="eyebrow">SUBJECT</span><div className="detailTitle"><div className="bigIcon" style={{background:subject.color+'22',color:subject.color}}><BookOpen size={25}/></div><div><h1>{subject.name}</h1><p>{subject.category} · {subject.code||'CUSTOM'} · {subject.target_hours||0} target hours</p></div></div></div><div className="detailHeroActions"><div className="detailProgress"><span>Progress</span><b>{progress}%</b><div className="bar"><i style={{width:`${progress}%`,background:subject.color}}/></div><small>{completed}/{subjectTasks.length} tasks complete</small></div><div className="subjectActionStack"><button type="button" className="secondary editSubjectAction" onClick={()=>onEditSubject?.(subject)}><Pencil size={15}/> Edit subject <ArrowUpRight size={14}/></button><button type="button" className="secondary dangerAction" onClick={()=>deleteSubject(subject)}><Trash2 size={15}/> Delete subject</button></div></div></div>
   <div className="detailTabs">
    <button className={section==='tasks'?'selected':''} onClick={()=>setSection('tasks')}><CheckSquare size={16}/> Tasks <span>{subjectTasks.length}</span></button>
    <button className={section==='description'?'selected':''} onClick={()=>setSection('description')}><FileText size={16}/> Description</button>
    <button className={section==='notes'?'selected':''} onClick={()=>setSection('notes')}><FilePlus2 size={16}/> Notes <span>{pdfs.length}</span></button>
   </div>
   {section==='tasks'&&<div className="panel subjectTaskPanel">{subjectTasks.length?subjectTasks.map(t=><div className={'taskRow detailed '+(t.status==='Done'?'taskCompleted':'')} key={t.id}><button className={t.status==='Done'?'check done':'check'} onClick={()=>toggle(t)} aria-label={t.status==='Done'?'Mark task incomplete':'Mark task complete'}>{t.status==='Done'&&<Check size={14}/>}</button><div className="taskInfo"><b>{t.title}</b><div>{(t.tags||[]).map(x=><span key={x}>#{x}</span>)}<span>{t.due_date||'No deadline'}</span><span>{t.estimated_minutes||0} min</span></div>{t.notes&&<p className="taskNotesPreview">{t.notes}</p>}</div><span className={'priority '+t.priority.toLowerCase()}>{t.priority}</span><div className="taskActions"><button type="button" className="iconbtn" onClick={()=>setModal({type:'task',task:t})} aria-label={`Edit ${t.title}`} title="Edit task"><Pencil size={15}/></button><button type="button" className="iconbtn dangerIcon" onClick={()=>deleteTask(t)} aria-label={`Delete ${t.title}`} title="Delete task"><Trash2 size={15}/></button></div></div>):<Empty text="No tasks in this subject yet. Add a task and assign it here."/>}</div>}
   {section==='description'&&<div className="panel subjectNotesPanel"><div className="panelHead"><div><span className="eyebrow">SUBJECT DESCRIPTION</span><h2>Description</h2></div><span className="notesSaved">A quick overview that stays with this subject</span></div><textarea className="subjectNotes" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Describe this subject, project, goal, or anything useful to remember..."/><div className="notesActions"><button className="secondary" onClick={()=>setDescription(subject.notes||'')}>Reset</button><button className="primary" onClick={saveDescription}>Save description</button></div></div>}
   {section==='notes'&&<div className="panel subjectNotesPanel pdfPanel"><div className="panelHead"><div><span className="eyebrow">SUBJECT NOTES</span><h2>PDF notes & resources</h2><p className="pdfIntro">Keep books, lecture notes, reference material, and other PDFs together for this subject.</p></div><div><input ref={fileInputRef} className="hiddenFileInput" type="file" accept="application/pdf,.pdf" multiple onChange={uploadPdfs}/><button className="primary" onClick={()=>fileInputRef.current?.click()} disabled={pdfBusy}><Upload size={16}/>{pdfBusy?'Adding…':'Add PDFs'}</button></div></div>{pdfs.length?<div className="pdfList">{pdfs.map(pdf=><div className="pdfCard" key={pdf.id}><div className="pdfIcon"><File size={20}/></div><div className="pdfInfo"><b title={pdf.name}>{pdf.name}</b><span>{formatBytes(pdf.size)} · Added {new Date(pdf.created_at).toLocaleDateString()}</span></div><div className="pdfActions"><button className="iconbtn" onClick={()=>openPdf(pdf.id)} aria-label={`Open ${pdf.name}`} title="Open PDF"><ExternalLink size={16}/></button><button className="iconbtn" onClick={()=>openPdf(pdf.id,true)} aria-label={`Download ${pdf.name}`} title="Download"><Download size={16}/></button><button className="iconbtn dangerIcon" onClick={()=>removePdf(pdf.id)} aria-label={`Remove ${pdf.name}`} title="Remove"><Trash2 size={16}/></button></div></div>)}</div>:<div className="pdfEmpty"><div className="pdfEmptyIcon"><FilePlus2 size={24}/></div><b>No PDF notes yet</b><span>Add textbooks, class notes, manuals, or reference PDFs for this subject.</span><button className="secondary" onClick={()=>fileInputRef.current?.click()}><Upload size={15}/> Add your first PDF</button></div>}<div className="pdfStorageHint"><ShieldCheck size={15}/><span>PDFs are stored securely in this browser for this device. Your subject and task data can still use cloud sync when configured.</span></div></div>}
 </section>
}
function Calendar({tasks,subjectMap,setModal}){
 const [view,setView]=useState('today');
 const [selectedDate,setSelectedDate]=useState(localDateKey(new Date()));
 const [cursor,setCursor]=useState(()=>{const d=new Date();d.setDate(1);d.setHours(0,0,0,0);return d});
 const today=localDateKey(new Date());
 const selectDate=(ds)=>setSelectedDate(ds);
 const addForDate=(ds)=>{selectDate(ds);setModal({type:'task',dueDate:ds});};
 const dayTasks=tasks.filter(t=>t.due_date===selectedDate);
 const selectedDateObj=fromDateKey(selectedDate);
 const titleDate=selectedDateObj.toLocaleDateString('en',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
 const shift=(n)=>{const d=new Date(cursor); if(view==='month') d.setMonth(d.getMonth()+n); else if(view==='year') d.setFullYear(d.getFullYear()+n); setCursor(d)};
 const resetToday=()=>{const d=new Date();d.setHours(0,0,0,0);setSelectedDate(localDateKey(d));setCursor(()=>{const x=new Date(d);x.setDate(1);return x});};
 const monthLabel=cursor.toLocaleDateString('en',{month:'long',year:'numeric'});
 const yearLabel=String(cursor.getFullYear());
 const renderTask=function(t){const done=t.status==='Done';return <div className={'event '+(done?'eventDone':'')} style={{borderLeftColor:subjectMap[t.subject_id]?.color||'#8b5cf6'}} key={t.id}><div className="eventTitle">{done?<Check size={11}/>:null}{t.title}</div><small>{subjectMap[t.subject_id]?.name||'Unassigned'} · {t.priority}</small></div>};
 const dayCell=(d,opts={})=>{const ds=localDateKey(d);const list=tasks.filter(t=>t.due_date===ds);const isToday=ds===today;const isSelected=ds===selectedDate;const isWeekend=[0,6].includes(d.getDay());return <button type="button" className={'day calendarDayBtn '+(isToday?'today ':'')+(isSelected?'selectedDay ':'')+(isWeekend?'weekend ':'')+(opts.muted?'mutedDay':'')} onClick={()=>selectDate(ds)} key={ds}><div className="dayHead"><div><b>{d.toLocaleDateString('en',{weekday:'short'})}</b><small>{d.toLocaleDateString('en',{month:'short'})}</small></div><strong>{d.getDate()}</strong></div><div className="dayEvents">{list.slice(0,4).map(renderTask)}{list.length>4&&<div className="moreEvents">+{list.length-4} more</div>}{!list.length&&<div className="dayEmpty">No tasks</div>}</div><span className="dayAdd" onClick={(e)=>{e.stopPropagation();addForDate(ds)}}><Plus size={12}/> Add</span></button>};
 const renderToday=()=>{const d=selectedDateObj;return <div className="calendarSingle"><button type="button" className={'largeDay '+(selectedDate===today?'today':'')} onClick={()=>selectDate(selectedDate)}><div><span className="eyebrow">SELECTED DAY</span><h3>{d.toLocaleDateString('en',{weekday:'long'})}</h3><b>{d.toLocaleDateString('en',{month:'long',day:'numeric',year:'numeric'})}</b></div><div className="largeDayCount">{dayTasks.length}<small>{dayTasks.length===1?'task':'tasks'}</small></div></button></div>};
 const renderThree=()=>{const base=fromDateKey(today);base.setDate(base.getDate()-1);return <div className="threeGrid">{[0,1,2].map(i=>{const d=new Date(base);d.setDate(base.getDate()+i);return dayCell(d)})}</div>};
 const renderMonth=()=>{const y=cursor.getFullYear(),m=cursor.getMonth();const first=new Date(y,m,1);const start=new Date(y,m,1-first.getDay());const cells=Array.from({length:42},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d});return <div className="monthWrap"><div className="weekLabels">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(x=><span key={x}>{x}</span>)}</div><div className="monthGrid">{cells.map(d=>dayCell(d,{muted:d.getMonth()!==m}))}</div></div>};
 const renderYear=()=>{const y=cursor.getFullYear();return <div className="yearGrid">{Array.from({length:12},(_,m)=>{const first=new Date(y,m,1);const start=new Date(y,m,1-first.getDay());const cells=Array.from({length:42},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d});return <div className="miniMonth" key={m}><div className="miniMonthTitle"><b>{first.toLocaleDateString('en',{month:'long'})}</b><span>{cells.filter(d=>localDateKey(d)===today).length?'Today':''}</span></div><div className="miniWeekLabels">{['S','M','T','W','T','F','S'].map((x,i)=><span key={i}>{x}</span>)}</div><div className="miniMonthGrid">{cells.map(d=>{const ds=localDateKey(d);const list=tasks.filter(t=>t.due_date===ds);const muted=d.getMonth()!==m;const isToday=ds===today;const isSelected=ds===selectedDate;return <button type="button" key={ds} className={'miniDate '+(muted?'muted ':'')+(isToday?'today ':'')+(isSelected?'selected':'')} onClick={()=>selectDate(ds)} title={list.length?`${list.length} task${list.length>1?'s':''}`:'No tasks'}>{d.getDate()}{list.length?<i/>:null}</button>})}</div></div>})}</div>};
 const views={today:renderToday,three:renderThree,month:renderMonth,year:renderYear};
 return <section className="page"><div className="sectionTop"><div><span className="eyebrow">PLANNING VIEW</span><h1>Calendar</h1><p>Pick a view, select any date, and see or add tasks for that day.</p></div><div className="calendarControls"><div className="calendarTabs">{[['today','Today'],['three','3 Days'],['month','Month'],['year','Year']].map(([id,label])=><button key={id} className={view===id?'active':''} onClick={()=>{setView(id);if(id==='today')resetToday();}}>{label}</button>)}</div><div className="calendarNav"><button className="secondary" onClick={resetToday}>Today</button>{view!=='today'&&view!=='three'&&<><button className="iconbtn navArrow" onClick={()=>shift(-1)} aria-label="Previous">‹</button><span>{view==='month'?monthLabel:yearLabel}</span><button className="iconbtn navArrow" onClick={()=>shift(1)} aria-label="Next">›</button></>}</div></div></div><div className="calendarLegend"><span><i className="legendDot"/>Tasks</span><span><i className="legendRing"/>Today</span><span>{tasks.length} task{tasks.length===1?'':'s'} scheduled</span></div>{views[view]()}<div className="selectedDayPanel panel"><div className="panelHead"><div><span className="eyebrow">SELECTED DATE</span><h2>{titleDate}</h2></div><button className="primary" onClick={()=>addForDate(selectedDate)}><Plus size={16}/> Add task</button></div>{dayTasks.length?<div className="calendarTaskList">{dayTasks.map(renderTask)}</div>:<div className="calendarNoTasks">No tasks scheduled for this date yet.<button className="textBtn" onClick={()=>addForDate(selectedDate)}>Create the first task <ArrowUpRight size={14}/></button></div>}</div></section>
}

function fromDateKey(key){const [y,m,d]=key.split('-').map(Number);const x=new Date(y,m-1,d);x.setHours(0,0,0,0);return x}
function Focus({timer,running,setRunning,setTimer,onLogSession,focusMode,setFocusMode,pomodoros,setPomodoros,customMinutes,setCustomMinutes}){
 const mm=String(Math.floor(timer/60)).padStart(2,'0'),ss=String(timer%60).padStart(2,'0');
 const setPreset=(minutes,mode='pomodoro',count=1)=>{setRunning(false);setFocusMode(mode);if(mode==='pomodoro')setPomodoros(count);setTimer(minutes*60)};
 const applyCustom=()=>{const mins=Math.min(180,Math.max(1,Number(customMinutes)||1));setPreset(mins,'custom',1)};
 return <section className="page focusPage"><div className={"focusCard "+(running?"isRunning":"")}><span className="eyebrow">FOCUS MODE</span><h1>One thing at a time.</h1><p>Choose a preset or set exactly how long you want to focus.</p>
 <div className="focusOptions">
  <button className={'focusOption '+(focusMode==='pomodoro'&&pomodoros===1?'selected':'')} onClick={()=>setPreset(25,'pomodoro',1)}><b>1 Pomodoro</b><span>25 minutes</span></button>
  <button className={'focusOption '+(focusMode==='pomodoro'&&pomodoros===2?'selected':'')} onClick={()=>setPreset(50,'pomodoro',2)}><b>2 Pomodoros</b><span>50 minutes</span></button>
  <button className={'focusOption '+(focusMode==='pomodoro'&&pomodoros===3?'selected':'')} onClick={()=>setPreset(75,'pomodoro',3)}><b>3 Pomodoros</b><span>75 minutes</span></button>
  <div className={'focusOption customFocus '+(focusMode==='custom'?'selected':'')}><div><b>Custom</b><span>Set your own time</span></div><div className="customControl"><input aria-label="Custom focus minutes" type="number" min="1" max="180" value={customMinutes} onChange={e=>setCustomMinutes(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')applyCustom()}}/><span>min</span><button className="secondary mini" onClick={applyCustom}>Apply</button></div></div>
 </div>
 <div className="timer">{mm}<span>:</span>{ss}</div><div className="timerMeta">{focusMode==='custom'?'Custom session':`${pomodoros} ${pomodoros===1?'Pomodoro':'Pomodoros'}`}</div>
 <div className="timerActions"><button className="primary big" onClick={()=>setRunning(!running)}>{running?<Pause/>:<Play/>}{running?'Pause':'Start focus'}</button><button className="secondary" onClick={()=>{setRunning(false);setPreset(focusMode==='custom'?Number(customMinutes)||30:pomodoros*25,focusMode,pomodoros)}}><RotateCcw size={17}/> Reset</button></div><button type="button" className="manualSessionBtn" onClick={onLogSession}><Clock3 size={15}/><span>Log a session manually</span><ArrowUpRight size={14}/></button></div></section>}


function Modal({title,onClose,children}){return <div className="overlay" onMouseDown={onClose}><div className="modal" onMouseDown={e=>e.stopPropagation()}><div className="modalHead"><h2>{title}</h2><button className="iconbtn" onClick={onClose}><X/></button></div>{children}</div></div>}
createRoot(document.getElementById('root')).render(<App/>);
