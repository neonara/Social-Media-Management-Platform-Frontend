"use client";

import { useState } from "react";

import { GlobeIcon } from "@/assets/icons";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import InputGroup from "@/components/ui/FormElements/InputGroup";
import { TextAreaGroup } from "@/components/ui/FormElements/InputGroup/text-area";
import MultiSelect from "@/components/ui/FormElements/MultiSelect";
import { Checkbox } from "@/components/ui/FormElements/checkbox";
import { RadioInput } from "@/components/ui/FormElements/radio";
import { Select } from "@/components/ui/FormElements/select";
import { Switch } from "@/components/ui/FormElements/switch";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";

export default function FormElementsPage() {
  const [selectedCountry, setSelectedCountry] = useState("USA");

  return (
    <>
      <Breadcrumb pageName="Form Elements" />

      <div className="grid grid-cols-1 gap-9 sm:grid-cols-2">
        <div className="flex flex-col gap-9">
          <ShowcaseSection title="Input Fields" className="space-y-5.5 !p-6.5">
            <InputGroup
              label="Default input"
              placeholder="Default input text"
              type="text"
            />

            <InputGroup
              label="Active input"
              placeholder="Active input text"
              active
              type="text"
            />

            <InputGroup
              label="Disabled input"
              placeholder="Disabled input text"
              type="text"
              disabled
            />
          </ShowcaseSection>

          <ShowcaseSection
            title="Toggle switch input"
            className="space-y-5.5 !p-6.5"
          >
            <Switch />
            <Switch backgroundSize="sm" />
            <Switch withIcon />
            <Switch background="dark" />
          </ShowcaseSection>

          <ShowcaseSection title="File upload" className="space-y-5.5 !p-6.5">
            <InputGroup
              type="file"
              fileStyleVariant="style1"
              label="Attach file"
              placeholder="Attach file"
            />

            <InputGroup
              type="file"
              fileStyleVariant="style2"
              label="Attach file"
              placeholder="Attach file"
            />
          </ShowcaseSection>
        </div>

        <div className="flex flex-col gap-9">
          <ShowcaseSection title="Textarea Fields" className="space-y-6 !p-6.5">
            <TextAreaGroup
              label="Default textarea"
              placeholder="Default textarea"
            />

            <TextAreaGroup
              label="Active textarea"
              placeholder="Active textarea"
              active
            />

            <TextAreaGroup
              label="Disabled textarea"
              placeholder="Disabled textarea"
              disabled
            />
          </ShowcaseSection>

          <ShowcaseSection title="Select input" className="space-y-5.5 !p-6.5">
            <Select
              label="Select Country"
              items={[
                { label: "United States", value: "USA" },
                { label: "United Kingdom", value: "UK" },
                { label: "Canada", value: "Canada" },
              ]}
              value={selectedCountry}
              onChange={(value) => setSelectedCountry(value)}
              prefixIcon={<GlobeIcon />}
            />
            <MultiSelect id="multiSelect" />
          </ShowcaseSection>

          <ShowcaseSection
            title="Checkbox and radio"
            className="space-y-5.5 !p-6.5"
          >
            <Checkbox label="Checkbox Text" />
            <Checkbox label="Checkbox Text" withIcon="check" />
            <Checkbox label="Checkbox Text" withIcon="x" />
            <RadioInput label="Checkbox Text" />
            <RadioInput label="Checkbox Text" variant="circle" />
          </ShowcaseSection>
        </div>
      </div>
    </>
  );
}
