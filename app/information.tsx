import { useFormContext, useWatch } from "react-hook-form";
import { AuthenticatorSchema } from "./type";
import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";

export function InformationPage() {
  const { control, setValue } = useFormContext<AuthenticatorSchema>();

  const email = useWatch({ control, name: "email" });
  const loading = useWatch({ control, name: "loading" });
  const name = useWatch({ control, name: "name" });
  const organization = useWatch({ control, name: "organization" });

  return (
    <section className="flex flex-col justify-center items-center gap-y-10">
      <h1 className="text-3xl">Submit Your Basic Information</h1>
      <div className="w-[500px] h-[500px] flex flex-col gap-y-3">
        <Input
          type="email"
          variant="underlined"
          label="Email"
          value={email}
          disabled
        />
        <Input
          type="name"
          variant="underlined"
          label="Full Name"
          value={name}
          onChange={(e) => setValue("name", e.target.value)}
        />
        <Input
          type="name"
          variant="underlined"
          label="Your Orgnization"
          className="mb-3"
          value={organization}
          onChange={(e) => setValue("organization", e.target.value)}
        />
        <Button
          color="primary"
          isLoading={loading}
          onClick={() => {
            setValue("faceStep", true);
          }}
        >
          {loading ? "Loading" : "Submit"}
        </Button>
      </div>
    </section>
  );
}
