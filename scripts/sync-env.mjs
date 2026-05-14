import { access, readFile, writeFile } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'dotenv';
import { z } from 'zod';

const currentFilePath = fileURLToPath(import.meta.url);
const projectRoot = resolve(dirname(currentFilePath), '..');
const envFilePath = resolve(projectRoot, '.env');
const proxyConfigPath = resolve(projectRoot, 'proxy.conf.json');

const envSchema = z.object({
  NG_APP_BACKEND_URL: z
    .string({
      required_error: 'NG_APP_BACKEND_URL es obligatorio en el archivo .env',
      invalid_type_error: 'NG_APP_BACKEND_URL debe ser una cadena de texto'
    })
    .trim()
    .url('NG_APP_BACKEND_URL debe ser una URL valida en el archivo .env (ej: http://localhost:5000/api)')
});

const removeTrailingSlash = (value) => value.replace(/\/+$/, '');

const readFileIfExists = async (filePath) => {
  try {
    await access(filePath, fsConstants.F_OK);
    return await readFile(filePath);
  } catch {
    return null;
  }
};

const envBuffer = await readFileIfExists(envFilePath);

if (!envBuffer) {
  console.error('❌ Error: El archivo .env no existe. Por favor, crealo en la raiz del proyecto.');
  process.exit(1);
}

const envContent = envBuffer[0] === 0xff && envBuffer[1] === 0xfe
  ? envBuffer.toString('utf16le')
  : envBuffer.toString('utf8');

const fileEnv = parse(envContent.replace(/^\uFEFF/, ''));

// Validate variables
let parsedEnv;
try {
  parsedEnv = envSchema.parse({
    ...process.env,
    ...fileEnv
  });
} catch (error) {
  console.error('❌ Error de validacion en .env:');
  if (error instanceof z.ZodError) {
    error.errors.forEach(err => console.error(`   - ${err.message}`));
  } else {
    console.error(error);
  }
  process.exit(1);
}

const backendUrl = removeTrailingSlash(parsedEnv.NG_APP_BACKEND_URL);
const backend = new URL(backendUrl);
const backendOrigin = `${backend.protocol}//${backend.host}`;

// Solo actualizamos el proxy.conf.json
// El environment.ts ahora es gestionado directamente por @ngx-env/builder
await writeFile(
  proxyConfigPath,
  JSON.stringify(
    {
      '/api': {
        target: backendOrigin,
        secure: false,
        changeOrigin: true,
        logLevel: 'info'
      }
    },
    null,
    2
  ),
  'utf8'
);

console.log(`✅ Proxy sincronizado: target=${backendOrigin}`);
