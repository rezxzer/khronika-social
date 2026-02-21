import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">რეგისტრაცია</CardTitle>
          <CardDescription>შექმენი ანგარიში ქრონიკაზე</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">სახელი</Label>
            <Input id="name" type="text" placeholder="თქვენი სახელი" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">ელფოსტა</Label>
            <Input id="email" type="email" placeholder="name@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">პაროლი</Label>
            <Input id="password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">გაიმეორე პაროლი</Label>
            <Input id="confirm-password" type="password" />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button className="w-full">რეგისტრაცია</Button>
          <p className="text-sm text-muted-foreground">
            უკვე გაქვს ანგარიში?{" "}
            <Link href="/login" className="text-primary underline">
              შესვლა
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
