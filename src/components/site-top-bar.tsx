import Link from "next/link";

export function SiteTopBar() {
    return (
        <header className="site-topbar">
            <div className="container site-topbar-inner">
                <div className="site-topbar-left">
                    <span className="site-domain">klbq.lolser.fun</span>
                    <div className="site-brand">卡丘工坊地图评价</div>
                </div>
                <nav className="site-nav" aria-label="主导航">
                    <Link className="pill" href="/">返回首页</Link>
                    <Link className="pill" href="/reviews">批量评价</Link>
                    <Link className="pill" href="/admin">后台管理</Link>
                    <Link className="pill" href="/embed">展示页</Link>
                </nav>
            </div>
        </header>
    );
}
