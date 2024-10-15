import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { useFormContext, useWatch } from "react-hook-form";
import { AuthenticatorSchema } from "./type";
import { authenApi } from "./api";

export function InputValid() {
  const { control, setValue } = useFormContext<AuthenticatorSchema>();
  const loading = useWatch({ control, name: "loading" });
  const email = useWatch({ control, name: "email" });

  const handleClick = async () => {
    setValue("loading", true);

    try {
      // Make the API request using fetch
      const response = await fetch(`${authenApi}${email}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420",
        },
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const data = await response.json();

      if (!data) {
        return;
      }

      if (data.status === true) {
        setValue("success", true);
      }

      if (data.status === false) {
        setValue("fail", true);
      }
    } catch (error) {
      console.error("API request failed:", error);
    } finally {
      setValue("loading", false);
    }
  };

  return (
    <div className="flex w-[600px] gap-x-3 justify-center items-center">
      <Input
        type="email"
        label="Email"
        className="w-[500px]"
        value={email}
        onChange={(e) => setValue("email", e.target.value)}
      />
      <div>
        <Button
          color="primary"
          isLoading={loading}
          className="h-[56px]"
          onClick={handleClick}
        >
          {loading ? "Loading" : "Confirm"}
        </Button>
      </div>
    </div>
  );
}
