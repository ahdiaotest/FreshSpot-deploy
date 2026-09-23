"use client";

import { LivePanel } from "./LivePanel";
import { VouchersPanel } from "./VouchersPanel";
import { ReportStatusForm } from "./ReportStatusForm";
import { PostVoucherForm } from "./PostVoucherForm";
import { useHomeApp } from "./useHomeApp";

export function HomeApp() {
  const {
    tab, setTab, category, setCategory, places,
    loading, showReport, setShowReport, showPost, setShowPost,
    claimBanner, postBanner, showCategoryChips, filtered,
    openVouchers, claimedVouchers, handleClaimed, rememberCreated, load,
  } = useHomeApp();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[390px] flex-col bg-stone-100">
      <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-white/95 px-4 pb-3 pt-4 backdrop-blur">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-stone-900">
            鲜点 <span className="text-emerald-600">FreshSpot</span>
          </h1>
          <p className="text-[11px] text-stone-500">
            JB live status + vouchers · 新山实况与券池
          </p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-1 rounded-2xl bg-stone-100 p-1">
          <button
            type="button"
            onClick={() => setTab("live")}
            className={`rounded-xl py-2 text-sm font-semibold transition ${
              tab === "live" ? "bg-white text-emerald-700 shadow-sm" : "text-stone-500"
            }`}
          >
            看实况 · Live
          </button>
          <button
            type="button"
            onClick={() => setTab("vouchers")}
            className={`rounded-xl py-2 text-sm font-semibold transition ${
              tab === "vouchers" ? "bg-white text-violet-700 shadow-sm" : "text-stone-500"
            }`}
          >
            券池 · Vouchers
          </button>
        </div>
      </header>

      <main className="flex-1 space-y-3 px-4 py-4 pb-28">
        {loading && (
          <p className="py-8 text-center text-sm text-stone-400">Loading… 加载中</p>
        )}
        {!loading && tab === "live" && (
          <LivePanel
            category={category}
            setCategory={setCategory}
            showCategoryChips={showCategoryChips}
            filtered={filtered}
            postBanner={postBanner}
            onReport={() => setShowReport(true)}
          />
        )}
        {!loading && tab === "vouchers" && (
          <VouchersPanel
            claimBanner={claimBanner}
            openVouchers={openVouchers}
            claimedVouchers={claimedVouchers}
            onClaimed={handleClaimed}
          />
        )}
      </main>

      <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-[390px] -translate-x-1/2 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur">
        {tab === "live" ? (
          <button
            type="button"
            onClick={() => setShowReport(true)}
            className="w-full rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md active:scale-[0.98]"
          >
            Report status · 报实况 · Laporkan
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowPost(true)}
            className="w-full rounded-2xl bg-violet-600 py-3 text-sm font-bold text-white shadow-md active:scale-[0.98]"
          >
            Post voucher · 放券 · Kongsi baucar
          </button>
        )}
      </div>

      {showReport && (
        <ReportStatusForm
          places={places}
          onCancel={() => setShowReport(false)}
          onDone={rememberCreated}
        />
      )}
      {showPost && (
        <PostVoucherForm
          onCancel={() => setShowPost(false)}
          onDone={() => {
            setShowPost(false);
            load();
          }}
        />
      )}
    </div>
  );
}
