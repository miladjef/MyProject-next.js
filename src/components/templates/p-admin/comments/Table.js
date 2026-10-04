"use client";
import styles from "./table.module.css";
import { useRouter } from "next/navigation";
import { showSwal } from "@/utils/helpers";
import swal from "sweetalert";
import { showAdminForm } from "@/utils/adminDialog";

export default function DataTable({ comments, title }) {
  const router = useRouter();
  const request = async (url, options, success) => { const res = await fetch(url, options); const data = await res.json().catch(() => ({})); if (!res.ok) return swal({title:data.message||"عملیات انجام نشد",icon:"error",buttons:"فهمیدم"}); if(success) await swal({title:success,icon:"success",buttons:"فهمیدم"}); router.refresh(); };
  const acceptComment = (id) => request("/api/comments/accept", { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id}) }, "کامنت تایید شد");
  const rejectComment = (id) => request("/api/comments/reject", { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id}) }, "کامنت رد شد");
  const edit = async (c) => { const values=await showAdminForm({title:"ویرایش دیدگاه",fields:[{name:"body",label:"متن دیدگاه",value:c.body,type:"textarea"}]}); if(!values)return; await request(`/api/comments/${c._id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({body:values.body})},"دیدگاه ویرایش شد"); };
  const reply = async (c) => { const values=await showAdminForm({title:"پاسخ مدیر",fields:[{name:"adminReply",label:"پاسخ",value:c.adminReply||"",type:"textarea"}]}); if(!values)return; await request(`/api/comments/${c._id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({adminReply:values.adminReply})},"پاسخ ثبت شد"); };
  const remove = (c) => swal({title:"دیدگاه حذف شود؟",icon:"warning",buttons:["خیر","بله"]}).then((ok)=>ok&&request(`/api/comments/${c._id}`,{method:"DELETE"},"دیدگاه حذف شد"));
  const ban = (c) => request("/api/user/ban",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:c.email})},"کاربر مسدود شد");

  return <div><div><h1 className={styles.title}><span>{title}</span></h1></div><div className={styles.table_container}><table className={styles.table}><thead><tr><th>شناسه</th><th>کاربر</th><th>ایمیل</th><th>امتیاز</th><th>محصول</th><th>تاریخ</th><th>مشاهده</th><th>ویرایش</th><th>حذف</th><th>تایید / رد</th><th>پاسخ</th><th>بن</th></tr></thead><tbody>{comments.map((c,index)=><tr key={c._id}><td className={c.isAccept?styles.accept:styles.reject}>{index+1}</td><td>{c.username}</td><td>{c.email}</td><td>{c.score}</td><td>{c.productID?.name||"محصول حذف شده"}</td><td>{new Date(c.date).toLocaleDateString("fa-IR")}</td><td><button type="button" className={styles.edit_btn} onClick={()=>showSwal(c.body,undefined,"بستن")}>مشاهده</button></td><td><button type="button" className={styles.edit_btn} onClick={()=>edit(c)}>ویرایش</button></td><td><button type="button" className={styles.delete_btn} onClick={()=>remove(c)}>حذف</button></td><td>{c.isAccept?<button type="button" className={styles.delete_btn} onClick={()=>rejectComment(c._id)}>رد</button>:<button type="button" className={styles.delete_btn} onClick={()=>acceptComment(c._id)}>تایید</button>}</td><td><button type="button" className={styles.edit_btn} onClick={()=>reply(c)}>{c.adminReply?"ویرایش پاسخ":"پاسخ"}</button></td><td><button type="button" className={styles.delete_btn} onClick={()=>ban(c)}>بن</button></td></tr>)}</tbody></table></div></div>;
}
