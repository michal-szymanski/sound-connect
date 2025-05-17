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
import { signUp } from "@/server-functions/auth";
import { AuthError } from "@/types/auth";

export const Route = createFileRoute("/(auth)/sign-up/")({
  component: SignUp,
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

function SignUp() {
  const formSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8).max(128),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const router = useRouter();

  const handleServerError = ({ code, message: error }: AuthError) => {
    switch (code) {
      case "USER_ALREADY_EXISTS":
      case "INVALID_EMAIL":
      case "FAILED_TO_CREATE_USER":
        form.setError("email", { message: error });
        break;
      case "PASSWORD_TOO_SHORT":
      case "PASSWORD_TOO_LONG":
        form.setError("password", { message: error });
        break;
      default:
        form.setError("email", { message: error });
        break;
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const result = await signUp({ data: values });

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
            Create an account
          </h1>
          <div className="flex flex-col gap-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-3"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                <Button type="submit">Sign Up</Button>
              </form>
            </Form>
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link to="/sign-in" className="underline underline-offset-4">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
