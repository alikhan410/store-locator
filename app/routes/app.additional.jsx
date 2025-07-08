import {
  Card,
  Layout,
  Page,
  Form,
  FormLayout,
  TextField,
  Button,
} from "@shopify/polaris";
import {useState, useCallback} from 'react';
import { TitleBar } from "@shopify/app-bridge-react";

export default function AdditionalPage() {

  const [newsletter, setNewsletter] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = useCallback(() => {
    setEmail('');
    setNewsletter(false);
  }, []);

  const handleNewsLetterChange = useCallback(
    (value) => setNewsletter(value),
    [],
  );

  const handleEmailChange = useCallback((value) => setEmail(value), []);
  return (
    <Page>
      <TitleBar title="Additional page" />
      <Layout>
        <Layout.Section>
          <Card>
            <Form onSubmit={handleSubmit}>
            <FormLayout>

              <TextField
                value={email}
                onChange={handleEmailChange}
                label="Store Name"
                type="text"
                autoComplete="email"
              />              
             


              <Button submit>Submit</Button>
            </FormLayout>
          </Form>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

// function Code({ children }) {
//   return (
//     <Box
//       as="span"
//       padding="025"
//       paddingInlineStart="100"
//       paddingInlineEnd="100"
//       background="bg-surface-active"
//       borderWidth="025"
//       borderColor="border"
//       borderRadius="100"
//     >
//       <code>{children}</code>
//     </Box>
//   );
// }
