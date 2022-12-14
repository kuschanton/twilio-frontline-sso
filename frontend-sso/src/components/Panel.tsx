import React, {useState} from 'react'
import {TabAgents} from './TabAgents'
import {TabAuditlogs} from './TabAuditlogs'
import {Tab, TabList, TabPanel, TabPanels, Tabs, Toaster, useTabState, useToaster} from '@twilio-paste/core'
import {Box} from '@twilio-paste/core/box'
import {Theme} from '@twilio-paste/core/dist/theme'
import {WelcomeDialog} from './WelcomeDialog'

export const Panel = () => {
  const tab = useTabState()
  const isAuditTabSelected = tab.currentId?.endsWith('-4')
  const [helperTokenInitialized, setHelperTokenInitialized] = useState(false)
  const toaster = useToaster();

  const showToast = (message: string) => {
    toaster.push({
      message: message,
      variant: 'success',
      dismissAfter: 3000
    })
  }

  if (!helperTokenInitialized) {
    return (
      <Theme.Provider theme='default'>
        <WelcomeDialog setHelperTokenInitialized={() => setHelperTokenInitialized(true)}/>
      </Theme.Provider>
    )
  } else {
    return (
      <Theme.Provider theme='default'>
        <Box margin='space50'>
          <Tabs state={tab}>
            <TabList aria-label='State hook tabs'>
              <Tab>Manage</Tab>
              <Tab>Audit logs</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                {!isAuditTabSelected ? <TabAgents showToast={showToast}/> : null}
              </TabPanel>
              <TabPanel>
                {isAuditTabSelected ? <TabAuditlogs/> : null}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
        <Toaster {...toaster} />
      </Theme.Provider>
    )
  }
}
