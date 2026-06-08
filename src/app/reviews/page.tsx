import { ReviewForm } from "@/components/forms";
import { loadState } from "@/lib/github-store";
import { summarizeState } from "@/lib/state-utils";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
    const state = await loadState();
    const summary = summarizeState(state);

    return (
        <main className="app-shell">
            <div className="container grid gap-18">
                <section className="panel panel-pad">
                    <p className="section-title">地图评级</p>
                    <div className="classification-grid">
                        <div className="classification-item">
                            <strong>神图</strong>
                            <p>在趣味性、美观性、引导性、总体评价里<br />超过 3.5 分的维度 ≥ 3 项</p>
                        </div>
                        <div className="classification-item">
                            <strong>好图</strong>
                            <p>在同样四项里<br />超过 2 分的维度 ≥ 3 项</p>
                        </div>
                        <div className="classification-item">
                            <strong>神人图</strong>
                            <p>在同样四项里<br />低于 2 分的维度 ≥ 1 项</p>
                        </div>
                        <div className="classification-item">
                            <strong>史图</strong>
                            <p>在同样四项里<br />低于 2 分的维度 ≥ 3 项</p>
                        </div>
                    </div>
                    <p className="help" style={{ marginTop: 12, marginBottom: 0 }}>难易度不参与评价</p>
                </section>

                <section className="panel panel-pad" id="submit-review">
                    <p className="section-title">批量提交评价</p>
                    <ReviewForm maps={summary.maps} />
                </section>
            </div>
        </main>
    );
}
