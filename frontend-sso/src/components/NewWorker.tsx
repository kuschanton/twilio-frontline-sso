import React from 'react'
import {Button, Input, Label, Toaster, useToaster} from '@twilio-paste/core'
import {Box} from '@twilio-paste/core/box'
import {ModalDialogPrimitiveOverlay, ModalDialogPrimitiveContent} from '@twilio-paste/modal-dialog-primitive'
import {styled} from '@twilio-paste/styling-library'
import {apiSaveWorker} from '../helpers/apis'

interface BasicModalDialogProps {
  isOpen: boolean;
  handleClose: () => void;
  refreshTable: () => void;
  showToast: (message: string) => void
}

const StyledModalDialogOverlay = styled(ModalDialogPrimitiveOverlay)({
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: 'rgba(0, 0, 0, 0.7)',
})
const StyledModalDialogContent = styled(ModalDialogPrimitiveContent)({
  width: '100%',
  maxWidth: '560px',
  maxHeight: 'calc(100% - 60px)',
  background: '#f4f5f6',
  borderRadius: '5px',
  padding: '20px',
})

export const NewWorker: React.FC<BasicModalDialogProps> = ({isOpen, handleClose, refreshTable, showToast}) => {

  const toaster = useToaster()
  const inputRef = React.useRef() as any
  const [isLoading, setIsLoading] = React.useState(false)
  const [name, setName] = React.useState('')
  const [phoneNumber, setPhoneNumber] = React.useState('')

  const onClick = async () => {
    setIsLoading(true)
    await apiSaveWorker(name, phoneNumber)
    showToast(`Successfully added worker ${name}`)
    setIsLoading(false)
    refreshTable()
    handleClose()
  }

  return (
    <StyledModalDialogOverlay isOpen={isOpen} onDismiss={handleClose} allowPinchZoom={true} initialFocusRef={inputRef}>
      <StyledModalDialogContent>
        <Box margin='space40'>
          <Box>
            <Label htmlFor='name'>Agent Name</Label>
            <Input
              id='name'
              name='name'
              type='text'
              placeholder='John'
              onChange={(e) => {
                setName(e.target.value)
              }}
            />
          </Box>
          <Box marginTop='space80'>
            <Label htmlFor='phoneNumber'>Phone Number</Label>
            <Input
              id='phoneNumber'
              name='phoneNumber'
              type='text'
              placeholder='+49123123123'
              onChange={(e) => {
                setPhoneNumber(e.target.value)
              }}
            />
          </Box>
          <Box marginTop='space80'>
            <Box display='inline-block' width='100%' textAlign='right'>
              <Button variant='primary' loading={isLoading} onClick={onClick}>
                Save
              </Button>
            </Box>
          </Box>
        </Box>
      </StyledModalDialogContent>
      <Toaster {...toaster} />
    </StyledModalDialogOverlay>
  )
}
