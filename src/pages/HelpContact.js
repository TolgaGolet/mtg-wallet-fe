import {
  Container,
  Title,
  Accordion,
  Grid,
  Text,
  Button,
  rem,
} from "@mantine/core";
import { IconMailFilled } from "@tabler/icons-react";
import classes from "./HelpContact.module.css";

export default function HelpContact() {
  const onClickMail = () => {
    window.location.href = "mailto:m.tolgaglt@gmail.com";
  };

  return (
    <Container size="sm" className={classes.wrapper}>
      <Title ta="center" mb="lg">
        Frequently Asked Questions
      </Title>

      <Accordion variant="separated">
        <Accordion.Item className={classes.item} value="forgot-password">
          <Accordion.Control>
            I forgot my password. How can I reset it?
          </Accordion.Control>
          <Accordion.Panel>
            {"Contact us via email: m.tolgaglt@gmail.com"}
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
      <Grid>
        <Grid.Col span={12} sm={6} md={4}>
          <Text align="center" size="lg" weight={700}>
            Contact Us
          </Text>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Button
              leftSection={
                <IconMailFilled style={{ width: rem(16), height: rem(16) }} />
              }
              onClick={onClickMail}
              mt={15}
            >
              m.tolgaglt@gmail.com
            </Button>
          </div>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
