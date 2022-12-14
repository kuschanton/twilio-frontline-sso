import React from 'react'
import {
  Button,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalFooterActions,
  ModalHeader,
  ModalHeading,
  Text,
} from '@twilio-paste/core'
import {setHelperToken} from '../helpers/apis'
import {Box} from '@twilio-paste/core/box'

export function WelcomeDialog(
  props: { setHelperTokenInitialized: () => void },
) {

  const initialFormData = Object.freeze({
    helperAuthToken: '',
  })

  const [formData, updateFormData] = React.useState(initialFormData)

  const handleChange = (e: any) => {
    updateFormData({
      ...formData,
      [e.target.id]: e.target.value.trim(),
    })
  }

  const handleSubmit = () => {
    setHelperToken(formData.helperAuthToken)
    props.setHelperTokenInitialized()
  }

  return (
    <div>
      <Modal
        ariaLabelledby={'modalHeadingID'}
        isOpen={true}
        aria-labelledby='edit-apartment'
        onDismiss={() => {
        }}
        size='default'
      >
        <ModalHeader id='welcomeDialog'>
          <ModalHeading as='h1' id='modalHeadingID'>
            Frontline SSO Admin
          </ModalHeading>
        </ModalHeader>
        <ModalBody>
          <Box marginBottom='space80'>
            <Label htmlFor='helperAuthToken' required>Helper Auth Token</Label>
            <Input
              id='helperAuthToken'
              placeholder='XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
              type='password'
              onChange={handleChange}
            />
          </Box>
        </ModalBody>
        <ModalFooter>
          <Text as='p' fontSize='fontSize40' color='colorTextError'><b>WARNING:</b> This SSO Admin should not be used in production</Text>
          <ModalFooterActions>
            <Button onClick={handleSubmit} variant='primary'>
              Submit
            </Button>
          </ModalFooterActions>
        </ModalFooter>
      </Modal>
    </div>
  )
}
