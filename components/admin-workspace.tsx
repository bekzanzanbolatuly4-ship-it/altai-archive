'use client';
import {useEffect,useState} from 'react';
import Image from 'next/image';
import {ArrowUpRight,Download,FileText,LogOut,ShieldAlert,Trash2,Upload,Users} from 'lucide-react';
import {useApp} from './providers';

type User={id:string;email:string;name:string;role:string;disabled:boolean};
type Doc={id:string;title:string;description:string;date:string;fond:string;inventory:string;caseName:string;documentIdentifier:string;keywords:string[];language:string;provenance:string;accessStatus:'public'|'restricted';status:'draft'|'review'|'approved'|'published'|'archived';originalName:string;size:number;mimeType:string;createdBy?:string};
type Feedback={id:string;type:string;name:string|null;email:string|null;message:string;rating:number|null;status:string;moderation_status:string;moderation_category:string|null;moderation_summary:string|null;moderation_reason:string|null;created_at:string;public_consent:boolean;public_display_name:string|null;publication_status:'private'|'pending'|'published'|'rejected';publication_reviewed_at:string|null};

const roles=['SITE_ADMIN','ARCHIVE_EMPLOYEE','EDITOR','BRANCH_ADMIN','MODERATOR','ANALYST'];

async function request(url:string,init?:RequestInit){
 const r=await fetch(url,{...init,cache:'no-store'});
 const j=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(j.error||`Request failed (${r.status})`);
 return j;
}

export function AdminWorkspace({readOnly=false,persistentAuth=false}:{readOnly?:boolean;persistentAuth?:boolean}){
 const{locale,msg}=useApp();
 const[user,setUser]=useState<User|null>(null);
 const[loading,setLoading]=useState(true);
 const[error,setError]=useState('');
 const[notice,setNotice]=useState('');
 const[docs,setDocs]=useState<Doc[]>([]);
 const[documentStorageReady,setDocumentStorageReady]=useState(true);
 const[users,setUsers]=useState<User[]>([]);
 const[feedback,setFeedback]=useState<Feedback[]>([]);
 const[feedbackSort,setFeedbackSort]=useState<'newest'|'oldest'|'highest'|'lowest'>('newest');
 const[feedbackType,setFeedbackType]=useState('all');
 const[moderationFilter,setModerationFilter]=useState('all');
 const[publicationFilter,setPublicationFilter]=useState('pending');
 const[feedbackSearch,setFeedbackSearch]=useState('');
 const[savingFeedbackId,setSavingFeedbackId]=useState<string|null>(null);
 const[tab,setTab]=useState<'documents'|'accounts'|'audit'|'feedback'>('documents');
 const[uploading,setUploading]=useState(false);
 const[savingId,setSavingId]=useState<string|null>(null);

 useEffect(()=>{
  request('/api/auth/me')
   .then(x=>setUser(x.user))
   .catch(()=>{})
   .finally(()=>setLoading(false));
 },[]);

 useEffect(()=>{
  if(!user)return;
  request('/api/admin/documents')
   .then(x=>{setDocs(x.documents);setDocumentStorageReady(x.storageReady!==false)})
   .catch(e=>setError(e.message));

  if(user.role==='SUPERADMIN'){
   request('/api/admin/users')
    .then(x=>setUsers(x.users))
    .catch(()=>{});
  }
 },[user]);

 useEffect(()=>{
  if(!user||tab!=='feedback')return;
  request(`/api/admin/feedback?sort=${feedbackSort}&type=${feedbackType}&moderation=${moderationFilter}`).then(x=>setFeedback(x.feedback)).catch(e=>setError(e.message));
 },[user,tab,feedbackSort,feedbackType,moderationFilter]);

 async function setReviewVisibility(item:Feedback,status:'private'|'published'){
  setError('');setNotice('');setSavingFeedbackId(item.id);
  try{
   await request('/api/admin/feedback',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:item.id,status})});
   setFeedback(rows=>rows.map(row=>row.id===item.id?{...row,publication_status:status}:row));
   setNotice(locale==='ru'?(status==='published'?'Отзыв опубликован.':'Отзыв снят с публикации.'):locale==='kk'?(status==='published'?'Пікір жарияланды.':'Пікір жарияланымнан алынды.'):(status==='published'?'Review published.':'Review unpublished.'));
  }catch(e){setError((e as Error).message)}finally{setSavingFeedbackId(null)}
 }

 async function deleteFeedback(item:Feedback){
  if(!window.confirm('Удалить это сообщение без возможности восстановления?'))return;
  setError('');setSavingFeedbackId(item.id);
  try{await request('/api/admin/feedback',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:item.id})});setFeedback(rows=>rows.filter(row=>row.id!==item.id));setNotice('Сообщение удалено.');}
  catch(e){setError((e as Error).message)}finally{setSavingFeedbackId(null)}
 }

 async function login(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();
  setError('');
  const f=new FormData(e.currentTarget);
  try{
   const x=await request('/api/auth/login',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email:f.get('email'),password:f.get('password')})
   });
   setUser(x.user);
  }catch(e){
   setError((e as Error).message);
  }
 }

 async function logout(){
  setError('');
  try{
   await request(persistentAuth?'/api/auth/staff-logout':'/api/auth/logout',{method:'POST'});
  }catch(e){
   setError((e as Error).message);
  }finally{
   setUser(null);
   setDocs([]);
   setUsers([]);
  }
 }

 if(loading)return <div className="page-wrap"><p>Загрузка…</p></div>;

 const visibleFeedback=feedback.filter(item=>`${item.name||''} ${item.email||''} ${item.message} ${item.moderation_category||''}`.toLocaleLowerCase().includes(feedbackSearch.trim().toLocaleLowerCase())&&(publicationFilter==='all'||item.publication_status===publicationFilter));

 if(!user){
  return (
   <div className="page-wrap admin-page">
    <PageTitle title="Вход для сотрудников"/>
    <div className="admin-warning">
     <ShieldAlert size={17}/>
     Публичной регистрации нет. Доступ предоставляется владельцем сайта.
    </div>
    {readOnly&&<div className="admin-warning"><ShieldAlert size={17}/>{persistentAuth?'Вход сотрудников выполняется через подтверждённый аккаунт Supabase с отдельным назначением роли.':'Демонстрация доступна только для чтения.'}</div>}
    <form className="admin-form" onSubmit={login}>
     <label>
      Email
      <input name="email" type="email" autoComplete="username" required/>
     </label>
     <label>
      Пароль
      <input name="password" type="password" autoComplete="current-password" required/>
     </label>
     <button className="outline-link">Войти <ArrowUpRight size={15}/></button>
     {error&&<p role="alert">{error}</p>}
    </form>
   </div>
  );
 }

 const canUpload=['SUPERADMIN','SITE_ADMIN','ARCHIVE_EMPLOYEE','BRANCH_ADMIN'].includes(user.role);
 const canPublish=['SUPERADMIN','SITE_ADMIN','EDITOR'].includes(user.role);
 const canEdit=['SUPERADMIN','SITE_ADMIN','ARCHIVE_EMPLOYEE','EDITOR','BRANCH_ADMIN','MODERATOR'].includes(user.role);
 const canExport=['SUPERADMIN','SITE_ADMIN','ANALYST'].includes(user.role);

 async function upload(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();
  setError('');
  setNotice('');
  setUploading(true);
  const f=e.currentTarget;
  try{
   const x=await request('/api/admin/documents',{
    method:'POST',
    body:new FormData(f)
   });
   setDocs([x.document,...docs]);
   f.reset();
   setNotice('Черновик сохранён в локальном хранилище.');
  }catch(e){
   setError((e as Error).message);
  }finally{
   setUploading(false);
  }
 }

 async function saveDoc(id:string,body:Record<string,unknown>){
  setError('');
  setSavingId(id);
  try{
   const x=await request(`/api/admin/documents/${id}`,{
    method:'PATCH',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(body)
   });
   setDocs(docs.map(d=>d.id===id?x.document:d));
   setNotice('Изменения сохранены.');
  }catch(e){
   setError((e as Error).message);
   try{
    setDocs((await request('/api/admin/documents')).documents);
   }catch{}
  }finally{
   setSavingId(null);
  }
 }

 async function deleteDoc(id:string){
  if(!window.confirm('Удалить эту запись и связанный файл из хранилища?'))return;
  setError('');
  setSavingId(id);
  try{
   await request(`/api/admin/documents/${id}`,{method:'DELETE'});
   setDocs(docs.filter(d=>d.id!==id));
   setNotice('Документ удалён.');
  }catch(e){
   setError((e as Error).message);
   try{
    setDocs((await request('/api/admin/documents')).documents);
   }catch{}
  }finally{
   setSavingId(null);
  }
 }

 async function createStaff(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();
  setError('');
  const f=e.currentTarget;
  try{
   await request('/api/admin/users',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(Object.fromEntries(new FormData(f)))
   });
   setUsers((await request('/api/admin/users')).users);
   f.reset();
   setNotice(persistentAuth?'Роль сохранена в Supabase. Сотрудник входит через свой подтверждённый аккаунт.':'Учётная запись создана. Передайте сотруднику пароль безопасным способом.');
  }catch(e){
   setError((e as Error).message);
  }
 }

 return (
  <div className="page-wrap admin-page">
   <div className="admin-head-row">
    <PageTitle title="Рабочее пространство архива"/>
    <div style={{display:'flex',gap:'0.75rem',alignItems:'center'}}>
     <span className="mini-demo">{user.role}</span>
     {canExport&&!readOnly&&(
      <a
       href="/api/admin/export"
       download
       className="outline-link"
       style={{display:'inline-flex',alignItems:'center',gap:'0.35rem',padding:'0.3rem 0.6rem',fontSize:'0.8rem'}}
      >
       <Download size={14}/> Экспорт архива
      </a>
     )}
     <button className="text-button" onClick={logout}>
      <LogOut size={16}/>Выйти
     </button>
    </div>
   </div>

   <p className="admin-identity">
    Государственный архив Восточно-Казахстанской области
   </p>

   <div className="admin-warning">
    <ShieldAlert size={17}/>
    {persistentAuth?'Каталог документов остаётся в режиме чтения. Сотруднические роли и отзывы хранятся в Supabase и проверяются сервером.':readOnly?'Демонстрация доступна только для чтения. Изменения каталога, аккаунтов и экспорт отключены.':'Локальное файловое хранилище для одного экземпляра приложения. Вход и операции управления проверяются сервером.'}
   </div>
   {persistentAuth&&!documentStorageReady&&<p className="admin-warning">Документы не загружены: постоянное хранилище архивных файлов для Production пока не подключено. Публикация документов здесь отключена.</p>}

   <nav className="admin-tabs">
    <button onClick={()=>setTab('documents')}>Документы ({docs.length})</button>
    {user.role==='SUPERADMIN'&&<button onClick={()=>setTab('accounts')}>Сотрудники</button>}
    {['SUPERADMIN','SITE_ADMIN','MODERATOR'].includes(user.role)&&<button onClick={()=>setTab('feedback')}>Отзывы</button>}
    {['SUPERADMIN','SITE_ADMIN','ANALYST'].includes(user.role)&&(
     <button onClick={()=>setTab('audit')}>Журнал действий</button>
    )}
   </nav>

   {error&&<p role="alert" className="admin-error">{error}</p>}
   {notice&&<p role="status" className="admin-notice">{notice}</p>}

   {tab==='documents'&&(
    <>
     <div className="admin-main-head">
      <div>
       <span className="eyebrow">ПРОВЕРЕННЫЕ СЕРВЕРНЫЕ ОПЕРАЦИИ</span>
       <h2>Документы · {docs.length}</h2>
      </div>
     </div>

     {canUpload&&!readOnly&&(
      <details className="upload-panel" open>
       <summary>
        <Upload size={18}/>
        Загрузить PDF или изображение <span>Максимум {process.env.NEXT_PUBLIC_UPLOAD_LIMIT_MB||25} МБ</span>
       </summary>
       <form className="admin-form upload-form" onSubmit={upload} encType="multipart/form-data">
        <label>
         Файл · PDF, JPG, PNG, WebP или TIFF
         <input
          name="file"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.tif,.tiff,application/pdf,image/jpeg,image/png,image/webp,image/tiff"
          required
         />
        </label>
        <label>
         Название
         <input name="title" required maxLength={250}/>
        </label>
        <label>
         Описание
         <textarea name="description" rows={3}/>
        </label>
        <div className="admin-fields">
         <label>Дата<input name="date" placeholder="Без подтверждённой даты"/></label>
         <label>Язык<input name="language" placeholder="Русский, Казахский…"/></label>
        </div>
        <div className="admin-fields">
         <label>Фонд<input name="fond" placeholder="Ф. 120"/></label>
         <label>Опись<input name="inventory" placeholder="оп. 1"/></label>
         <label>Дело<input name="caseName" placeholder="д. 45"/></label>
        </div>
        <div className="admin-fields">
         <label>Идентификатор документа<input name="documentIdentifier"/></label>
         <label>Ключевые слова · через запятую<input name="keywords"/></label>
        </div>
        <label>Источник и происхождение<input name="provenance"/></label>
        <label>
         Доступ
         <select name="accessStatus">
          <option value="restricted">Ограниченный · по умолчанию</option>
          {canPublish&&<option value="public">Публичный · откроется после публикации</option>}
         </select>
        </label>
        <button className="outline-link" disabled={uploading}>
         {uploading?'Загрузка на сервер…':'Сохранить черновик'} <Upload size={15}/>
        </button>
       </form>
      </details>
     )}

     {docs.length===0&&<p>Пока нет загруженных записей.</p>}

     {docs.map(d=>(
      <DocumentRow
       key={d.id}
       doc={d}
       canEdit={canEdit&&!readOnly}
       canPublish={canPublish&&!readOnly}
       canDelete={!readOnly&&(canPublish||d.createdBy===user.id)}
       isSaving={savingId===d.id}
       onSave={saveDoc}
       onDelete={deleteDoc}
      />
     ))}
    </>
   )}

   {tab==='accounts'&&user.role==='SUPERADMIN'&&(
    <>
     <h2>Сотрудники</h2>
     {(!readOnly||persistentAuth)&&<form className="admin-form staff-form" onSubmit={createStaff}>
      {persistentAuth?<p>Назначайте роль только существующему пользователю с подтверждённой почтой. Регистрация сотрудников закрыта.</p>:<label>Имя<input name="name" required maxLength={100}/></label>}
      <label>Email<input name="email" type="email" required/></label>
      {!persistentAuth&&<label>Временный пароль<input name="password" type="password" minLength={12} required/></label>}
      <label>
       Роль
       <select name="role">
        {roles.map(r=><option key={r}>{r}</option>)}
       </select>
      </label>
      <button className="outline-link">{persistentAuth?'Назначить роль':'Создать сотрудника'} <Users size={15}/></button>
     </form>}

     {users.filter(x=>x.role!=='SUPERADMIN').map(x=>(
      <div className="admin-row" key={x.id}>
       <span>
        <b>{x.name} · {x.email}</b>
        <small>{x.role}{x.disabled?' · отключён':''}</small>
       </span>
       {(!readOnly||persistentAuth)&&<select
        value={x.role}
        onChange={async e=>{
         await request('/api/admin/users',{
          method:'PATCH',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({id:x.id,role:e.target.value})
         });
         setUsers((await request('/api/admin/users')).users);
        }}
       >
        {roles.map(r=><option key={r}>{r}</option>)}
       </select>}
       {(!readOnly||persistentAuth)&&<button
        className="text-button"
        onClick={async()=>{
         await request('/api/admin/users',{
          method:'PATCH',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({id:x.id,disabled:!x.disabled})
         });
         setUsers((await request('/api/admin/users')).users);
        }}
       >
        {x.disabled?'Включить':'Отключить'}
       </button>}
      </div>
     ))}
    </>
   )}

   {tab==='audit'&&<AuditLog/>}

   {tab==='feedback'&&['SUPERADMIN','SITE_ADMIN','MODERATOR'].includes(user.role)&&(
    <section className="admin-feedback-list">
    <h2>{msg('reviewQueueTitle')}</h2>
    <p className="admin-feedback-count">{msg('reviewQueueHelp')}</p>
    {readOnly&&!persistentAuth&&<p className="admin-warning">Публикация и удаление отключены: для безопасных изменений на сайте нужно настроить постоянную авторизацию сотрудников.</p>}
    <div className="admin-feedback-filters">
     <label>Поиск<input value={feedbackSearch} onChange={e=>setFeedbackSearch(e.target.value)} placeholder="Имя, email или текст"/></label>
     <label>Тип<select value={feedbackType} onChange={e=>setFeedbackType(e.target.value)}><option value="all">Все типы</option><option value="site_feedback">Отзывы</option><option value="suggestion">Предложения</option><option value="site_bug">Ошибки</option></select></label>
     <label>{msg('reviewPublication')}<select value={publicationFilter} onChange={e=>setPublicationFilter(e.target.value)}><option value="pending">{msg('reviewPending')}</option><option value="published">{msg('reviewPublished')}</option><option value="private">{msg('reviewPrivate')}</option><option value="all">{msg('reviewAllStatuses')}</option></select></label>
     <label>AI-модерация<select value={moderationFilter} onChange={e=>setModerationFilter(e.target.value)}><option value="all">Все статусы</option><option value="classified">Классифицировано</option><option value="needs_review">Требует проверки</option></select></label>
     <label>Сортировка<select aria-label="Сортировка отзывов" value={feedbackSort} onChange={e=>setFeedbackSort(e.target.value as 'newest'|'oldest'|'highest'|'lowest')}><option value="newest">Сначала новые</option><option value="oldest">Сначала старые</option><option value="highest">Сначала высокая оценка</option><option value="lowest">Сначала низкая оценка</option></select></label>
    </div>
    <p className="admin-feedback-count">Показано {visibleFeedback.length} из {feedback.length}</p>
    {visibleFeedback.map(item=><article className="admin-row" key={item.id}><span><b>{item.type} · {item.name||'Без имени'}</b><small>{item.rating?`${'★'.repeat(item.rating)}${'☆'.repeat(5-item.rating)} · ${item.rating}/5`:''} {item.email||'Контакт не указан'} · {new Date(item.created_at).toLocaleString()}</small><p>{item.message}</p><small>{item.moderation_status==='classified'?`AI-категория: ${item.moderation_category||'не определена'} · решение не принято автоматически`:'Требует проверки'}{item.moderation_summary?` · ${item.moderation_summary}`:''}</small>{item.moderation_reason&&<small>{item.moderation_reason}</small>}<small>Публикация: {item.publication_status}{item.public_consent?' · пользователь дал отдельное согласие':' · согласия на публикацию нет'}</small>{(!readOnly||persistentAuth)&&<div className="admin-feedback-actions">{item.publication_status==='published'?<button type="button" disabled={savingFeedbackId===item.id} onClick={()=>setReviewVisibility(item,'private')}>{msg('reviewUnpublish')}</button>:<><button type="button" disabled={savingFeedbackId===item.id||!item.public_consent||item.type!=='site_feedback'||!item.rating} onClick={()=>setReviewVisibility(item,'published')}>{msg('reviewApprove')}</button>{(!item.public_consent||item.type!=='site_feedback'||!item.rating)&&<small>{msg('reviewConsentRequired')}</small>}</>}{['SUPERADMIN','SITE_ADMIN'].includes(user.role)&&<button className="danger" type="button" disabled={savingFeedbackId===item.id} onClick={()=>deleteFeedback(item)}>Удалить</button>}</div>}</span></article>)}
     {!visibleFeedback.length&&<p>По выбранным фильтрам сообщений нет.</p>}
    </section>
   )}
  </div>
 );
}

function DocumentRow({
 doc:d,
 canEdit,
 canPublish,
 canDelete,
 isSaving,
 onSave,
 onDelete
}:{
 doc:Doc;
 canEdit:boolean;
 canPublish:boolean;
 canDelete:boolean;
 isSaving:boolean;
 onSave:(id:string,b:Record<string,unknown>)=>void;
 onDelete:(id:string)=>void;
}){
 const[form,setForm]=useState(d);
 const[keywords,setKeywords]=useState(d.keywords.join(', '));

 useEffect(()=>{
  setForm(d);
  setKeywords(d.keywords.join(', '));
 },[d]);

 const downloadUrl=`/api/admin/documents/${d.id}/file?download=1`;
 const allowedNextStatuses:Record<Doc['status'],Doc['status'][]>= {
  draft:['review'],
  review:['draft',...(canPublish?['approved' as const]:[])],
  approved:canPublish?['published']:[],
  published:canPublish?['archived']:[],
  archived:[]
 };
 const nextStatuses=allowedNextStatuses[d.status];

 return (
  <details className="admin-row document-admin-row">
   <summary>
    <FileText size={18}/>
    <span>
     <b>{d.title}</b>
     <small>{d.status} · {d.accessStatus} · {d.originalName} · {Math.ceil(d.size/1024)} KB</small>
    </span>
    <ArrowUpRight size={15}/>
   </summary>

   <div className="document-admin-preview">
    <div style={{marginBottom:'0.75rem',display:'flex',gap:'0.5rem',alignItems:'center'}}>
     <a href={downloadUrl} download={d.originalName} className="text-button" style={{display:'inline-flex',alignItems:'center',gap:'0.3rem'}}>
      <Download size={14}/> Скачать оригинал
     </a>
     {d.mimeType==='application/pdf'&& (
      <a href={`/api/admin/documents/${d.id}/file`} target="_blank" rel="noreferrer" className="text-button" style={{display:'inline-flex',alignItems:'center',gap:'0.3rem'}}>
       Открыть PDF <ArrowUpRight size={14}/>
      </a>
     )}
    </div>

    {d.mimeType==='application/pdf'?(
     <iframe title={d.title} src={`/api/admin/documents/${d.id}/file`} style={{width:'100%',height:'400px',border:'1px solid var(--border)'}}/>
    ):d.mimeType==='image/tiff'?(
     <div style={{padding:'2rem',border:'1px dashed var(--border)',textAlign:'center'}}>
      <p>TIFF формат · скачайте для полного архивного просмотра</p>
     </div>
    ):(
     <Image
      src={`/api/admin/documents/${d.id}/file`}
      alt={d.title}
      width={1000}
      height={700}
      unoptimized
     />
    )}
   </div>

   {canEdit&&(
    <form
     className="admin-form"
     onSubmit={e=>{
      e.preventDefault();
      const metadata:Record<string,unknown>={
       title:form.title,
       description:form.description,
       date:form.date,
       fond:form.fond,
       inventory:form.inventory,
       caseName:form.caseName,
       documentIdentifier:form.documentIdentifier,
       language:form.language,
       provenance:form.provenance,
       keywords:keywords.split(',').map(x=>x.trim()).filter(Boolean)
      };
      if(canPublish){
       metadata.status=form.status;
       metadata.accessStatus=form.accessStatus;
      }
      onSave(d.id,metadata);
     }}
    >
     <label>Название<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label>
     <label>Описание<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
     <div className="admin-fields">
      {(['date','fond','inventory','caseName','documentIdentifier','language','provenance'] as const).map(k=>(
       <label key={k}>{k}<input value={form[k]||''} onChange={e=>setForm({...form,[k]:e.target.value})}/></label>
      ))}
     </div>
     <label>Ключевые слова<input value={keywords} onChange={e=>setKeywords(e.target.value)}/></label>
     {canPublish&&(
      <div className="admin-fields">
       <label>
        Статус
        <select value={form.status} onChange={e=>setForm({...form,status:e.target.value as Doc['status']})}>
         {[d.status,...nextStatuses].map(x=><option key={x}>{x}</option>)}
        </select>
       </label>
       <label>
        Доступ
        <select value={form.accessStatus} onChange={e=>setForm({...form,accessStatus:e.target.value as Doc['accessStatus']})}>
         <option value="restricted">Ограниченный</option>
         <option value="public">Публичный</option>
        </select>
       </label>
      </div>
     )}
     <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap',alignItems:'center',marginTop:'0.5rem'}}>
      <button className="outline-link" disabled={isSaving}>
       {isSaving?'Сохранение…':'Сохранить изменения'}
      </button>
      {d.status==='draft'&&(
       <button
        type="button"
        className="text-button"
        disabled={isSaving}
        onClick={()=>{void onSave(d.id,{status:'review'})}}
       >
        Отправить на проверку
       </button>
      )}
      {d.status==='review'&&(
       <>
        <button type="button" className="text-button" disabled={isSaving} onClick={()=>{void onSave(d.id,{status:'draft'})}}>
         Вернуть на доработку
        </button>
        {canPublish&&<button type="button" className="text-button" disabled={isSaving} onClick={()=>{void onSave(d.id,{status:'approved'})}}>Одобрить</button>}
       </>
      )}
      {d.status==='approved'&&canPublish&&(
       <button type="button" className="text-button" disabled={isSaving} onClick={()=>{void onSave(d.id,{status:'published',accessStatus:'public'})}}>
        Опубликовать
       </button>
      )}
      {d.status==='published'&&canPublish&&(
       <button
        type="button"
        className="text-button"
        disabled={isSaving}
        onClick={()=>{void onSave(d.id,{status:'archived',accessStatus:'restricted'})}}
       >
        Снять с публикации (в архив)
       </button>
      )}
      {canDelete&&(
       <button
        type="button"
        className="text-button"
        disabled={isSaving}
        style={{marginLeft:'auto',color:'var(--danger, #c62828)'}}
        onClick={()=>onDelete(d.id)}
       >
        <Trash2 size={14}/> Удалить
       </button>
      )}
     </div>
    </form>
   )}
  </details>
 );
}

function AuditLog(){
 const[rows,setRows]=useState<{actor:string;action:string;target:string;at:string}[]>([]);
 useEffect(()=>{
  request('/api/admin/audit')
   .then(x=>setRows(x.audit))
   .catch(()=>{});
 },[]);
 return (
  <div>
   {rows.length===0?(
    <p>Журнал действий пуст.</p>
   ):(
    rows.map((x,i)=>(
     <p key={i}>
      {new Date(x.at).toLocaleString()} · {x.actor} · <b>{x.action}</b> · {x.target}
     </p>
    ))
   )}
  </div>
 );
}

function PageTitle({title}:{title:string}){
 return (
  <header className="page-hero">
   <div className="breadcrumb">Государственный архив Восточно-Казахстанской области <span>/</span> STAFF</div>
   <span className="eyebrow">STAFF · SECURE WORKSPACE</span>
   <h1>{title}</h1>
  </header>
 );
}
