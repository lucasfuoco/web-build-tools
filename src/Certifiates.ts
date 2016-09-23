import * as forgeType from 'node-forge';
const forge: typeof forgeType & IForgeExtensions = require('node-forge');
import * as fs from 'fs';
import * as path from 'path';

import * as child_process from 'child_process';
import { EOL } from 'os';

import CertificateStore from './CertificateStore';

const serialNumber: string = '73 1c 32 17 44 e3 46 50 a2 02 e3 ef 91 c3 c1 b9'.replace(/ /g, '');
const friendlyName: string = 'gulp-core-build-serve Development Certificate';

let _certutilExePath: string;

export interface ICertificate {
  pemCertificate: string;
  pemKey: string;
}

interface IAttr {
  name: string;
  value: string;
}

interface IForgeCertificate {
  publicKey: any; // tslint:disable-line:no-any

  validity: {
    notBefore: Date;
    notAfter: Date;
  };

  serialNumber: string;

  setSubject(attrs: IAttr[]): void;

  setIssuer(attrs: IAttr[]): void;

  setExtensions(extensions: any[]): void; // tslint:disable-line:no-any

  sign(privateKey: string, algorithm: IForgeSignatureAlgorithm): void; // tslint:disable-line:no-any
}

interface IForgeSignatureAlgorithm {
}

interface IForgeExtensions {
  pki: {
    createCertificate(): IForgeCertificate;
    certificateToPem(certificate: IForgeCertificate): string;
  };

  md: {
    sha256: {
      create(): IForgeSignatureAlgorithm;
    }
  };
}

export function CreateDevelopmentCertificate(): ICertificate {
  const keys: forgeType.pki.KeyPair = forge.pki.rsa.generateKeyPair(2048);
  const certificate: IForgeCertificate = forge.pki.createCertificate();
  certificate.publicKey = keys.publicKey;

  certificate.serialNumber = serialNumber;

  const now: Date = new Date();
  certificate.validity.notBefore = now;
  certificate.validity.notAfter.setFullYear(certificate.validity.notBefore.getFullYear() + 5); // Five years from now

  const attrs: IAttr[] = [{
    name: 'commonName',
    value: 'localhost'
  }];

  certificate.setSubject(attrs);
  certificate.setIssuer(attrs);

  certificate.setExtensions([
    {
      name: 'keyUsage',
      digitalSignature: true,
      keyEncipherment: true,
      dataEncipherment: true
    }, {
      name: 'extKeyUsage',
      serverAuth: true
    }]);

  // self-sign certificate
  certificate.sign(keys.privateKey, forge.md.sha256.create());

  // convert a Forge certificate to PEM
  const pem: string = forge.pki.certificateToPem(certificate);
  const privateKey: string = forge.pki.privateKeyToPem(keys.privateKey);

  return {
    pemCertificate: pem,
    pemKey: privateKey
  };
}

function ensureCertUtilExePath(): string {
  if (!_certutilExePath) {
    const where: child_process.SpawnSyncReturns<string> = child_process.spawnSync('where', ['certutil']);

    const whereErr: string = where.stderr.toString();
    if (!!whereErr) {
      console.error(`Error finding certUtil command: "${whereErr}"`);
      _certutilExePath = undefined;
    } else {
      _certutilExePath = where.stdout.toString().trim();
    }
  }

  return _certutilExePath;
}

function tryTrustCertificate(certificatePath: string): boolean {
  if (process.platform === 'win32') {
    const certutilExePath: string = ensureCertUtilExePath();
    if (!certutilExePath) {
      // Unable to find the cert utility
      return false;
    }

    console.log('Attempting to trust a dev certificate. This self-signed certificate only points to localhost ' +
                'and will be stored in your local user profile to be used by other instances of ' +
                'gulp-core-build-serve. If you do not consent to trust this certificate, click "NO" in the dialog.');

    const trustResult: child_process.SpawnSyncReturns<string> =
      child_process.spawnSync(certutilExePath, ['-user', '-addstore', 'root', certificatePath]);

    if (trustResult.status !== 0) {
      console.log(`Error: ${trustResult.stdout.toString()}`);

      const errorLines: string[] = trustResult.stdout.toString().split(EOL).map((line: string) => line.trim());

      // Not sure if this is always the status code for "cancelled" - should confirm.
      if (trustResult.status === 2147943623 ||
          errorLines[errorLines.length - 1].indexOf('The operation was canceled by the user.') > 0) {
        console.log('Certificate trust cancelled.');
      } else {
        console.log('Certificate trust failed with an unknown error.');
      }

      return false;
    } else {
      console.log('Successfully trusted development certificate.');

      return true;
    }
  } else {
    // Not implemented yet
  }
}

function trySetFriendlyName(certificatePath: string): boolean {
  if (process.platform === 'win32') {
    const certutilExePath: string = ensureCertUtilExePath();
    if (!certutilExePath) {
      // Unable to find the cert utility
      return false;
    }

    const basePath: string = path.dirname(certificatePath);
    const fileName: string = path.basename(certificatePath, path.extname(certificatePath));
    const friendlyNamePath: string = path.join(basePath, `${fileName}.inf`);

    const friendlyNameFile: string = [
      '[Version]',
      'Signature = "$Windows NT$"',
      '[Properties]',
      `11 = "{text}${friendlyName}"`,
      ''
    ].join(EOL);

    fs.writeFileSync(friendlyNamePath, friendlyNameFile);

    const repairStoreResult: child_process.SpawnSyncReturns<string> =
      child_process.spawnSync(certutilExePath, ['–repairstore',
                                                '–user',
                                                'root',
                                                serialNumber,
                                                friendlyNamePath]);

    if (repairStoreResult.status !== 0) {
      console.log(`Error: ${repairStoreResult.stdout.toString()}`);

      return false;
    } else {
      console.log('Successfully set certificate name.');

      return true;
    }
  } else {
    // Not implemented yet
  }
}

/**
 * Get the dev certificate from the store, or, optionally, generate a new one and trust it if one doesn't exist in the
 *  store.
 */
export function ensureCertificate(canGenerateNewCertificate: boolean): ICertificate {
  const certificateStore: CertificateStore = CertificateStore.instance;

  if ((!certificateStore.certificateData || !certificateStore.keyData) && canGenerateNewCertificate) {
    const generatedCertificate: ICertificate = CreateDevelopmentCertificate();

    const now: Date = new Date();
    const certificateName: string = now.getTime().toString();
    const tempDirName: string = path.join(__dirname, '..', 'temp');
    if (!fs.existsSync(tempDirName)) {
      fs.mkdirSync(tempDirName); // Create the temp dir if it doesn't exist
    }

    const tempCertificatePath: string = path.join(tempDirName, `${certificateName}.cer`);
    fs.writeFileSync(tempCertificatePath, generatedCertificate.pemCertificate);

    if (tryTrustCertificate(tempCertificatePath)) {
      certificateStore.certificateData = generatedCertificate.pemCertificate;
      certificateStore.keyData = generatedCertificate.pemKey;

      if (!trySetFriendlyName(tempCertificatePath)) { // Try to set the friendly name, and only error if we can't
        console.error('Unable to set the certificate\'s friendly name.');
      }
    } else {
      // Clear out the existing store data, if any exists
      certificateStore.certificateData = undefined;
      certificateStore.keyData = undefined;
    }

    fs.unlinkSync(tempCertificatePath);
  }

  return {
    pemCertificate: certificateStore.certificateData,
    pemKey: certificateStore.keyData
  };
}
