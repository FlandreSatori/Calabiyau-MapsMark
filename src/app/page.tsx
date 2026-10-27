import { MapForm } from "@/components/forms";
import { HomeMapExplorer } from "@/components/home-map-explorer";
// 使用表单内部的全局通知（避免从服务器组件传函数到客户端）
// 当前网页需要在vercel远端构建，谨慎处理客户端函数
import { formatDateTime } from "@/lib/format";
import { loadState } from "@/lib/github-store";
import { summarizeState } from "@/lib/state-utils";

export default async function HomePage({ searchParams }: { searchParams?: Promise<{ bg?: string }> }) {
    const state = await loadState();
    const summary = summarizeState(state);
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const background = resolvedSearchParams?.bg ?? state.ui?.background;

    return (
        <main className="app-shell" style={background ? { background } : undefined}>
            <div className="container grid gap-18">
                <HomeMapExplorer
                    maps={summary.maps}
                    reviews={summary.reviews}
                    mapTypes={summary.mapTypes}
                    typeCounts={summary.typeCounts}
                    categoryCounts={summary.categoryCounts}
                    mapCount={summary.mapCount}
                    reviewCount={summary.reviewCount}
                    updatedAt={formatDateTime(state.updatedAt)}
                />

                <section className="panel panel-pad" id="submit-map">
                    <p className="section-title">上传地图</p>
                    <MapForm mapTypes={summary.mapTypes} />
                </section>
            </div>
        </main>
    );
}
