import { Button } from "@/components/ui/button";
import {
  createFileRoute,
  Link,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signIn } from "@/server-functions/auth";
import { AuthError } from "@/types/auth";

export const Route = createFileRoute("/(auth)/sign-in/")({
  component: SignIn,
  beforeLoad: ({ context: { user } }) => {
    if (user) {
      const path = "/";
      console.info(`[App] Redirecting to: ${path}`);

      throw redirect({
        to: path,
      });
    }
  },
});

function SignIn() {
  const formSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const router = useRouter();

  const handleServerError = ({ code, message: error }: AuthError) => {
    switch (code) {
      case "INVALID_EMAIL_OR_PASSWORD":
        form.setError("email", { message: error });
        form.setError("password", { message: error });
        break;
      case "INVALID_EMAIL":
      case "USER_EMAIL_NOT_FOUND":
      case "EMAIL_NOT_VERIFIED":
        form.setError("email", { message: error });
        break;
      case "PROVIDER_NOT_FOUND":
      case "ID_TOKEN_NOT_SUPPORTED":
      case "FAILED_TO_GET_USER_INFO":
        break;
      default:
        form.setError("email", { message: error });
        break;
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const result = await signIn({ data: { ...values, rememberMe: true } });

    if (result.success) {
      router.navigate({ to: "/" });
    } else if (result.body) {
      handleServerError(result.body);
    }
  };

  return (
    <div className="container relative hidden h-full flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <h1 className="text-center text-2xl font-semibold tracking-tight">
            Sign in
          </h1>
          <div className="flex flex-col gap-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-3"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Sign In</Button>
              </form>
            </Form>
            <div className="text-center text-sm">
              Don't have an account?{" "}
              <Link to="/sign-up" className="underline underline-offset-4">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
