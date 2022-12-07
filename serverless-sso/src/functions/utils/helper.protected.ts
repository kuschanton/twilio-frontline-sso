import {IdentityProvider, SamlLib, ServiceProvider, setSchemaValidator} from 'samlify'
import memoizerific from 'memoizerific'

const assets = Runtime.getAssets()
import {ServerlessCallback} from '@twilio-labs/serverless-runtime-types/types'
import {Twilio as TwilioInterface} from 'twilio'
import {format} from 'timeago.js'

interface User {
  name: string
  phoneNumber: string
}

export const MIN = 1000 * 60

export const startCachedStuff = memoizerific(1)((twilioClient: TwilioInterface, SYNC_SERVICE_SID: string, DOMAIN_NAME: string) => {
  //
  // Validations
  //
  if (!twilioClient) {
    throw new Error('twilioClient is null. How come?!')
  }

  //
  // Assets
  //
  const loginResponseTemplate = myRequire('template-saml-response-orig.xml')
  const privateKey = myRequire('privatekey.cer')

  // for some strange reason, we have to remove the first and last line of the publickey...
  const publicKey = myRequire('publickey.cer').replace('-----BEGIN CERTIFICATE-----', '').replace('-----END CERTIFICATE-----', '').trim()

  const metadataTemplate = myRequire('idpmeta.xml').trim()
  const metadata = SamlLib.replaceTagsByValue(metadataTemplate, {DOMAIN_NAME, publicKey})

  console.log(metadata)

  //
  // Load IdP
  //
  setSchemaValidator({
    validate: (response) => {
      /* implment your own or always returns a resolved promise to skip */
      // console.log('TODO validate: ', response);
      return Promise.resolve('skipped')
    },
  })

  const idp = IdentityProvider({
    loginResponseTemplate: {context: loginResponseTemplate.trim()},
    // encryptCert: publicKey,
    privateKey: privateKey,
    metadata,
    // privateKeyPass: 'optional if your private key file is not protected',
  })

  const sp = ServiceProvider({isAssertionEncrypted: false})

  return {idp, sp}
})

export const TaskRouterClass = <any>memoizerific(1)(async (twilioClient: TwilioInterface, workspaceSid: string) => {
  return twilioClient.taskrouter.workspaces(workspaceSid)
})

export const myRequire = (file: string) => {
  try {
    return assets[`/${file}`].open().trim()
  } catch (e) {
    throw new Error(`File not found: /assets/${file}. Are you sure you added it?`)
  }
}

export class SyncClass {
  constructor(private twilioClient: TwilioInterface, private serviceSid: string, private syncListSid?: string) {
  }

  //
  // Sync Document methods
  //
  async fetchDocument(uniqueName: string) {
    try {
      return this.twilioClient.sync.services(this.serviceSid).documents(uniqueName).fetch()
    } catch (e) {
      throw new Error(
        `(SyncClass -> fetchDocument) Error while trying to fetch data from Twilio Sync. (uniqueName=${uniqueName}). Exception: ${e.message}`,
      )
    }
  }

  async createDocument(uniqueName: string, data: any, ttl = undefined) {
    try {
      return this.twilioClient.sync.services(this.serviceSid).documents.create({
        data,
        ttl,
        uniqueName,
      })
    } catch (e) {
      throw new Error(
        `(SyncClass -> createDocument) Error while trying to save data into Twilio Sync. The uniqueName=${uniqueName} havent gone throught. Whyyy?! Exception: ${e.message}`,
      )
    }
  }

  async deleteDocument(uniqueName: string) {
    try {
      return this.twilioClient.sync.services(this.serviceSid).documents(uniqueName).remove()
    } catch (e) {
      throw new Error(`(SyncClass -> deleteDocument) Exception: ${e.message}`)
    }
  }

  async updateDocument(uniqueName: string, data: any) {
    return this.twilioClient.sync.services(this.serviceSid).documents(uniqueName).update({
      data,
    })
  }

  async listDocuments() {
    const list = await this.twilioClient.sync.services(this.serviceSid).documents.list({pageSize: 100})
    return list.map((item: any) => {
      const {uniqueName, data} = item
      return {uniqueName, data}
    })
  }

  // user format: `user-${phoneNumber}`
  async getUser(user: string): Promise<User> {
    try {
      const {
        data: {name, phoneNumber},
      } = await this.fetchDocument(user)
      if (!name) {
        throw new Error('Bug: Name of the agent wasnt found.')
      }
      return {name, phoneNumber}
    } catch (e) {
      if (e.status === 404) {
        throw new Error('Agent not found using this phone number.')
      }
      throw e
    }
  }

  //
  // Sync List Methods
  //
  // section: "admin" or "login"
  async addLog(section: string, msg: string) {
    if (!this.syncListSid) {
      throw new Error('syncListSid wasnt initialized correctly.')
    }

    const data = {
      section,
      msg,
    }

    return this.twilioClient.sync.services(this.serviceSid).syncLists(this.syncListSid).syncListItems.create({data})
  }

  async listLogs() {
    if (!this.syncListSid) {
      throw new Error('syncListSid wasnt initialized correctly.')
    }

    const logs = await this.twilioClient.sync
      .services(this.serviceSid)
      .syncLists(this.syncListSid)
      .syncListItems.list({order: 'desc', pageSize: 200, limit: 1000})

    return logs
      .map(({index, dateCreated, data: {msg, section, department}}) => {
        return {index, section, timeAgo: format(dateCreated), msg, department}
      })
  }
}

export const ohNoCatch = (e: any, callback: ServerlessCallback) => {
  console.error('Exception: ', typeof e, e)
  const response = new Twilio.Response()
  response.setStatusCode(403)
  response.appendHeader('Access-Control-Allow-Origin', '*')
  response.appendHeader('Access-Control-Allow-Methods', 'OPTIONS POST GET')
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type')
  response.appendHeader('Content-Type', 'application/json')
  response.setBody({error: typeof e === 'string' ? e : e.message})
  callback(null, response)
}

export const ResponseOK = (obj: any, callback: ServerlessCallback) => {
  console.error('Response: ', typeof obj, obj)
  const response = new Twilio.Response()
  response.setStatusCode(200)
  response.appendHeader('Access-Control-Allow-Origin', '*')
  response.appendHeader('Access-Control-Allow-Methods', 'OPTIONS POST GET')
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type')
  response.appendHeader('Content-Type', 'application/json')
  response.setBody(typeof obj === 'string' ? {obj} : obj)
  callback(null, response)
}

export interface RequestWithHelperAuthToken {
  helperToken: string
}

export interface HelperAuthTokenContext {
  HELPER_AUTH_TOKEN: string
}

export const withHelperAuthTokenVerified = async (context: HelperAuthTokenContext, event: RequestWithHelperAuthToken, callback: ServerlessCallback, block: () => Promise<any>) => {
  if (event.helperToken === context.HELPER_AUTH_TOKEN) {
    await block()
  } else {
    ohNoCatch('Invalid helper auth token', callback)
  }
}

export const formatNumberToE164 = (_phoneNumber: string) => {
  const re = /^(0{2}|\+)(.+)/
  const subst = `+$2`

  let phoneNumber = _phoneNumber.replace(/[^0-9+]/gi, '')
  if (re.test(phoneNumber)) {
    phoneNumber = phoneNumber.replace(re, subst)
  }

  const regEx = /^\+[1-9]\d{9,14}$/
  if (!regEx.test(phoneNumber)) {
    throw new Error('This phone number does not seem to be formatted into the international E164 format.')
  }

  return phoneNumber
}
