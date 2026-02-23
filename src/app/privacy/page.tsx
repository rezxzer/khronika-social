import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "კონფიდენციალურობა",
  description: "ქრონიკის კონფიდენციალურობის პოლიტიკა.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 py-4">
      <h1 className="font-serif text-2xl font-bold sm:text-3xl">
        კონფიდენციალურობის პოლიტიკა
      </h1>

      <section className="space-y-3">
        <h2 className="font-serif text-lg font-semibold">რა მონაცემებს ვაგროვებთ</h2>
        <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed text-muted-foreground">
          <li><strong>ანგარიშის მონაცემები:</strong> ელფოსტა, მომხმარებლის სახელი, ავატარი.</li>
          <li><strong>კონტენტი:</strong> პოსტები, კომენტარები, რეაქციები — ის, რასაც თავად აქვეყნებ.</li>
          <li><strong>ტექნიკური:</strong> ანონიმური გვერდის ნახვების სტატისტიკა (IP მისამართი არ ინახება).</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-lg font-semibold">როგორ ვიყენებთ</h2>
        <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed text-muted-foreground">
          <li>პლატფორმის ფუნქციონირებისთვის (ავტორიზაცია, ფიდი, შეტყობინებები).</li>
          <li>პლატფორმის გაუმჯობესებისთვის (ანონიმური სტატისტიკა).</li>
          <li>არასოდეს ვყიდით პირად მონაცემებს მესამე მხარეს.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-lg font-semibold">შენი უფლებები</h2>
        <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed text-muted-foreground">
          <li>შეგიძლია მოითხოვო შენი მონაცემების ასლი.</li>
          <li>შეგიძლია მოითხოვო ანგარიშის და მონაცემების წაშლა.</li>
          <li>შეგიძლია ნებისმიერ დროს შეცვალო პროფილის ინფორმაცია.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-lg font-semibold">მონაცემთა უსაფრთხოება</h2>
        <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed text-muted-foreground">
          <li>მონაცემები ინახება Supabase-ის დაცულ სერვერებზე.</li>
          <li>პაროლები ჰეშირებულია და არასოდეს ინახება ღია ტექსტით.</li>
          <li>HTTPS კავშირი სავალდებულოა.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-lg font-semibold">კონტაქტი</h2>
        <p className="text-sm text-muted-foreground">
          კონფიდენციალურობასთან დაკავშირებული კითხვებისთვის მოგვწერე:{" "}
          <a href="mailto:privacy@khronika.ge" className="text-seal hover:underline">
            privacy@khronika.ge
          </a>
        </p>
      </section>

      <p className="text-xs text-muted-foreground">
        ბოლო განახლება: 2026 წლის თებერვალი
      </p>
    </div>
  );
}
