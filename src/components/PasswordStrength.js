import React from "react";
import { List, Progress, Text, ThemeIcon } from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";
import {
  passwordRequirements,
  PASSWORD_REQUIREMENT_LABELS,
} from "../validation/rules";

/** Live password checklist + progress bar, derived from the field value (no state). */
export default function PasswordStrength({ value }) {
  const requirements = Object.entries(passwordRequirements(value)).map(
    ([key, isMet]) => ({ label: PASSWORD_REQUIREMENT_LABELS[key], isMet })
  );
  const progressValue =
    (requirements.filter((req) => req.isMet).length / requirements.length) *
    100;

  return (
    <>
      <Progress
        value={progressValue}
        size="sm"
        color={progressValue === 100 ? "green" : "blue"}
        mt="xs"
      />
      <List mt="xs" type="unordered">
        {requirements.map((req) => (
          <List.Item
            key={req.label}
            icon={
              <ThemeIcon
                color={req.isMet ? "green" : "red"}
                size={16}
                radius="xl"
              >
                {req.isMet ? <IconCheck size={10} /> : <IconX size={10} />}
              </ThemeIcon>
            }
          >
            <Text size="sm" c={req.isMet ? "gray" : "red"}>
              {req.label}
            </Text>
          </List.Item>
        ))}
      </List>
    </>
  );
}
