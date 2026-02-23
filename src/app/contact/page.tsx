import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "კონტაქტი",
  description: "დაგვიკავშირდი — ქრონიკის გუნდი.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 py-4">
      <h1 className="font-serif text-2xl font-bold sm:text-3xl">
        კონტაქტი
      </h1>

      <p className="text-sm leading-relaxed text-muted-foreground">
        გვაქვს კითხვა, წინადადება ან პრობლემა? გვიხარია რომ გვეკონტაქტები.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-xl border bg-card p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-seal-muted">
            <Mail className="h-4 w-4 text-seal" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">ელფოსტა</h3>
            <a
              href="mailto:hello@khronika.ge"
              className="text-sm text-seal hover:underline"
            >
              hello@khronika.ge
            </a>
            <p className="mt-1 text-xs text-muted-foreground">
              ჩვეულებრივ ვპასუხობთ 24 საათში.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border bg-card p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-seal-muted">
            <MessageCircle className="h-4 w-4 text-seal" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">სოციალური ქსელები</h3>
            <p className="text-sm text-muted-foreground">
              მოგვყევი Instagram-ზე, Facebook-ზე ან X-ზე.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border bg-card p-4 sm:col-span-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-seal-muted">
            <MapPin className="h-4 w-4 text-seal" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">მისამართი</h3>
            <p className="text-sm text-muted-foreground">
              თბილისი, საქართველო
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        რეპორტებისთვის და კონტენტის წაშლის მოთხოვნისთვის გამოიყენე პლატფორმის
        ჩაშენებული „დაარეპორტე" ფუნქცია.
      </p>
    </div>
  );
}
