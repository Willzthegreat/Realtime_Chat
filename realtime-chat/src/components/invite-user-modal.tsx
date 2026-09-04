// "use client";

// import { useState } from "react";
// import { Button } from "@/src/components/ui/button";
// import { Input } from "@/src/components/ui/input";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/src/components/ui/dialog";
// import { UserPlus, UserPlusIcon } from "lucide-react";
// import { addUserToRoom } from "@/services/supabase/actions/rooms";
// import { useRouter } from "next/navigation";
// import { toast } from "sonner";
// import { Field, FieldError, FieldGroup, FieldLabel } from "./ui/field";
// import { Controller, controller, useForm } from "react-hook-form";
// import { LoadingSwap } from "./ui/loading-swap";
// import z from "zod";
// import { zodResolver } from "@hookform/resolvers/zod";

// // const inviteUserSchema = z.object({
// // //   email: z.string().email("Please enter a valid email address"),
// //   roomId: string
// // });


// const formSchma = z.object({
//     userId: z.string().min(1, "User ID is required").trim(),
// })

// type FormData = z.infer<typeof formSchma>

// export function InviteUserModal({ roomId }: InviteUserModalProps) {
//   const [open, setOpen] = useState(false);
//   const router = useRouter();
  
//   const form = useForm<FormData>({
//     resolver: zodResolver(formSchma),
//     defaultValues: {
//       userId: "",
//     },
//   });

//   async function onSubmit(data: FormData) {
//     const res = addUserToRoom( roomId, data.userId );

//     if (res.error) {
//       toast.error(res.message);
//     } else {
//     //   toast.success("User added to room");
//       setOpen(false);
//       router.refresh();}
//   }
// }


// return (
//     <>
//       <Dialog open={open} onOpenChange={setOpen}></Dialog>
//         <DialogTrigger asChild>
//           <Button variant="outline" className="w-full">
//             <UserPlusIcon className="mr-2 h-4 w-4" />
//             Invite User
//           </Button>
//         </DialogTrigger>
//         <DialogContent className="sm:max-w-md">
//           <DialogHeader>
//             <DialogTitle>Invite User to Room</DialogTitle>
//             <DialogDescription>
//               Enter the user ID to invite tothers to this room.
//             </DialogDescription>
//           </DialogHeader>
//           <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//             <FieldGroup>
//               <Controller
//                 name="userId"
//                 control={form.control}
//                 render=(({ field }) => (
//                   <>
//                     <FieldLabel>User ID</FieldLabel>
//                     <Input {...field} />
//                   </>
//                 ))}
//               >
//                 <FieldLabel>User ID</FieldLabel>
//                 <Input {...form.register("userId")} />
//                 {form.formState.errors.userId && (
//                   <FieldError>{form.formState.errors.userId.message}</FieldError>
//                 )}
//               </Controller>
//             </FieldGroup>
//             <Button type="submit">Invite</Button>
//           </form>
//         </DialogContent>
//       </Dialog>
//     </>
// )







"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { UserPlusIcon } from "lucide-react";
import { addUserToRoom } from "@/src/services/supabase/actions/rooms";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Controller, useForm } from "react-hook-form";
import { LoadingSwap } from "@/components/ui/loading-swap";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";




const formSchema = z.object({
  userId: z.string().min(1, "User ID is required").trim(),
});

type FormData = z.infer<typeof formSchema>;

interface InviteUserModalProps {
  roomId: string;
}

export function InviteUserModal({ roomId }: InviteUserModalProps) {
  const [open, setOpen] = useState(false);

  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),

    defaultValues: {
      userId: "",
    },
  });

  async function onSubmit(data: FormData) {
    const res = await addUserToRoom({ roomId, userId: data.userId });

    if (res.error) {
      toast.error(res.message);
    } else {
      toast.success("User added to room");
      form.reset();
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button variant="outline" type="button" className="shrink-0">
              <UserPlusIcon className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          }
        />

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite User to Room</DialogTitle>

            <DialogDescription>
              Enter the user ID to invite them to this room.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FieldGroup>
              <Controller
                name="userId"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>User ID</FieldLabel>

                    <Input
                      {...field}
                      placeholder="Enter user ID"
                    />

                    {form.formState.errors.userId && (
                      <FieldError>
                        {form.formState.errors.userId.message}
                      </FieldError>
                    )}
                  </Field>
                )}
              />
              <Field>
                <Button type="submit" className="grow" disabled={form.formState.isSubmitting}>
                  <LoadingSwap isLoading={form.formState.isSubmitting}>
                    Invite User
                  </LoadingSwap>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Close
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}


