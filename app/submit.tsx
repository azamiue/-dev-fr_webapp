import { useFormContext, useWatch } from "react-hook-form";
import { AuthenticatorSchema } from "./type";
import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { convertNameEmail } from "@/config/name";
export function Submit() {
  const { control, setValue } = useFormContext<AuthenticatorSchema>();

  const email = useWatch({ control, name: "email" });
  const name = useWatch({ control, name: "name" });
  const organization = useWatch({ control, name: "organization" });
  const zipPath = useWatch({ control, name: "zipPath" });

  const handleSubmit = async () => {
    const name = convertNameEmail(email);

    console.log("name", name);

    try {
      const response = await fetch(`/api/forwardZip?fileName=${name}`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data);
      } else {
        console.error("Error:", response.status, await response.text());
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <section className="flex flex-col justify-center items-center gap-y-10">
      <h1 className="text-3xl">Checking Your Information</h1>
      <div className="w-[500px] h-[500px] flex flex-col gap-y-3">
        <Input
          type="email"
          variant="underlined"
          label="Email"
          value={email}
          disabled
        />
        <Input
          type="text"
          variant="underlined"
          label="Full Name"
          value={name}
          onChange={(e) => setValue("name", e.target.value)}
        />
        <Input
          type="text"
          variant="underlined"
          label="Your Organization"
          className="mb-3"
          value={organization}
          onChange={(e) => setValue("organization", e.target.value)}
        />
        <Button color="primary" onClick={handleSubmit}>
          Submit
        </Button>
      </div>
    </section>
  );
}
