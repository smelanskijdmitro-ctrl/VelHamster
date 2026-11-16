import Link from "next/link";
import { MessageCircle, ShieldAlert, Lightbulb, Newspaper, CircleHelp, ArrowUpRight, Users } from "lucide-react";
import { getViewer } from "@/lib/auth";
const cats = [
 {icon:Newspaper,title:"Новости проекта",desc:"Обновления, события и важные объявления VelHamster",slug:"news",count:"Новости"},
 {icon:MessageCircle,title:"Общение",desc:"Обсуждаем игру, делимся впечатлениями и знакомимся",slug:"chat",count:"Обсуждения"},
 {icon:ShieldAlert,title:"Жалобы",desc:"Сообщить о проблеме или нарушении правил",slug:"complaints",count:"Обращения"},
 {icon:Lightbulb,title:"Идеи и предложения",desc:"Предлагайте новые функции и улучшения",slug:"ideas",count:"Идеи"},
 {icon:CircleHelp,title:"Помощь",desc:"Ответы на вопросы по игре и Telegram-боту",slug:"help",count:"Вопросы"}
];
export default async function Home() {
 const { user, profile, isAdmin } = await getViewer();
 return <><header className="topbar"><div className="shell topinner"><Link className="brand" href="/"><span className="logo">🐹</span> VELHAMSTER</Link><nav className="nav"><a href="#sections">Форум</a><a href="#about">О проекте</a><Link href="/rules">Правила</Link></nav><div className="actions">{user ? <><span className="profilepill">{profile?.username ?? user.email}</span>{isAdmin && <Link className="btn" href="/admin">Админка</Link>}<Link className="btn" href="/account">Профиль</Link></> : <><Link className="btn" href="/login">Войти</Link><Link className="btn primary" href="/register">Регистрация</Link></>}</div></div></header>
 <main className="shell"><section className="hero"><div><div className="eyebrow">Официальное сообщество</div><h1>Добро пожаловать<br/>в <span className="gradient">VelHamster</span></h1><p>Место, где встречаются игроки VelHamster. Следи за новостями, узнавай об обновлениях и помогай делать игру лучше.</p><div className="stats"><div className="stat"><b>🐹</b><span>Хомячья команда</span></div><div className="stat"><b>24/7</b><span>Сообщество</span></div><div className="stat"><b>∞</b><span>Идей для игры</span></div></div></div><div className="mascot">🐹</div></section>
 <div className="sectionhead" id="sections"><div><h2>Разделы форума</h2><p>Выбери интересующую категорию</p></div><span className="eyebrow">VELHAMSTER COMMUNITY</span></div>
 <div className="layout"><section className="categories">{cats.map(c=><Link className="category" href={`/forum/${c.slug}`} key={c.slug}><span className="caticon"><c.icon size={21}/></span><span className="cattext"><b>{c.title}</b><p>{c.desc}</p></span><span className="count">{c.count} <ArrowUpRight size={14}/></span></Link>)}</section>
 <aside><div className="sidecard"><h3><span className="online"/>Сообщество</h3><p>Форум VelHamster — официальная площадка для общения игроков и публикации новостей проекта.</p></div><div className="sidecard" id="about"><h3>📌 Как начать?</h3><p>Создай аккаунт, чтобы отправить жалобу. Публикация тем и ответов доступна только администрации.</p>{!user && <Link className="btn primary" href="/register">Создать аккаунт</Link>}</div><div className="sidecard"><h3>🛡️ Безопасность</h3><p>Соблюдай правила сообщества и уважай других участников.</p><Link className="mutedlink" href="/rules">Читать правила →</Link></div></aside></div></main>
 <footer className="footer"><div className="shell">© {new Date().getFullYear()} VelHamster · Сделано для сообщества 🐹</div></footer></>;
}