import { AdminWorkspace } from "@/components/admin-workspace";
import { HistoryList } from "@/components/history-list";
import { loadState } from "@/lib/github-store";
import { summarizeState } from "@/lib/state-utils";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
    const state = await loadState();
    const summary = summarizeState(state);

    return (
        <main className="app-shell">
            <div className="container grid gap-18">
                <AdminWorkspace
                    maps={summary.maps}
                    reviews={summary.reviews}
                    mapTypes={summary.mapTypes}
                    typeCounts={summary.typeCounts}
                    changeRequests={state.changeRequests ?? []}
                />

                <section className="panel panel-pad">
                    <div className="results-head">
                        <div>
                            <p className="eyebrow">ACTIVITY</p>
                            <h2 className="section-title results-title">日志</h2>
                        </div>
                    </div>
                    <HistoryList events={summary.events} maps={summary.maps} reviews={summary.reviews} mode="split" />
                </section>
            </div>
        </main>
    );
}
