import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "წესები",
  description: "ქრონიკის თემთა წესები და ქცევის კოდექსი.",
};

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 py-4">
      <h1 className="font-serif text-2xl font-bold sm:text-3xl">
        თემთა წესები
      </h1>

      <section className="space-y-3">
        <h2 className="font-serif text-lg font-semibold">1. პატივისცემა</h2>
        <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed text-muted-foreground">
          <li>მოექეცი სხვებს ისე, როგორც გინდა რომ მოგექცნენ.</li>
          <li>აკრძალულია სიძულვილის ენა, დისკრიმინაცია და ბულინგი.</li>
          <li>კრიტიკა კონსტრუქციული უნდა იყოს.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-lg font-semibold">2. კონტენტი</h2>
        <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed text-muted-foreground">
          <li>არ გამოაქვეყნო სპამი, რეკლამა ან შეუსაბამო მასალა.</li>
          <li>პოსტის ტიპი (ამბავი / სწავლება / მოწვევა) სწორად შეარჩიე.</li>
          <li>სხვისი ნაშრომის გამოყენებისას მიუთითე წყარო.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-lg font-semibold">3. უსაფრთხოება</h2>
        <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed text-muted-foreground">
          <li>არ გაავრცელო პირადი ინფორმაცია სხვა მომხმარებლების შესახებ.</li>
          <li>საეჭვო ქცევა დაარეპორტე — ჩვენ განვიხილავთ.</li>
          <li>ყალბი ანგარიშების შექმნა აკრძალულია.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-lg font-semibold">4. წრეების მართვა</h2>
        <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed text-muted-foreground">
          <li>წრის მფლობელი პასუხისმგებელია თავის თემზე.</li>
          <li>მოდერატორებს შეუძლიათ შეუსაბამო კონტენტის წაშლა.</li>
          <li>პლატფორმის ადმინისტრაცია იტოვებს უფლებას, წაშალოს წრე, რომელიც არღვევს წესებს.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-lg font-semibold">5. შედეგები</h2>
        <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed text-muted-foreground">
          <li>პირველი დარღვევა — გაფრთხილება.</li>
          <li>განმეორებითი დარღვევა — დროებითი შეზღუდვა.</li>
          <li>მძიმე დარღვევა — ანგარიშის სამუდამო დაბლოკვა.</li>
        </ul>
      </section>

      <p className="text-xs text-muted-foreground">
        ბოლო განახლება: 2026 წლის თებერვალი
      </p>
    </div>
  );
}
