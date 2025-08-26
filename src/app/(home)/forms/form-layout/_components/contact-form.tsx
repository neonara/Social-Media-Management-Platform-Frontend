import InputGroup from "@/components/ui/FormElements/InputGroup";
import { TextAreaGroup } from "@/components/ui/FormElements/InputGroup/text-area";
import { Select } from "@/components/ui/FormElements/select";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";

export function ContactForm() {
  return (
    <ShowcaseSection title="Contact Form" className="!p-6.5">
      <form action="#">
        <div className="mb-4.5 flex flex-col gap-4.5 xl:flex-row">
          <InputGroup
            label="First name"
            type="text"
            placeholder="Enter your first name"
            className="w-full xl:w-1/2"
          />

          <InputGroup
            label="Last name"
            type="text"
            placeholder="Enter your last name"
            className="w-full xl:w-1/2"
          />
        </div>

        <InputGroup
          label="Email"
          type="email"
          placeholder="Enter your email address"
          className="mb-4.5"
          required
        />

        <InputGroup
          label="Subject"
          type="text"
          placeholder="Enter your subject"
          className="mb-4.5"
        />

        <Select
          label="Subject"
          placeholder="Select your subject"
          className="mb-4.5"
          value="USA" // Default value
          items={[
            { label: "United States", value: "USA" },
            { label: "United Kingdom", value: "UK" },
            { label: "Canada", value: "Canada" },
          ]}
        />

        <TextAreaGroup label="Message" placeholder="Type your message" />

        <button className="mt-6 flex w-full justify-center rounded-lg bg-primary p-[13px] font-medium text-white hover:bg-opacity-90">
          Send Message
        </button>
      </form>
    </ShowcaseSection>
  );
}
