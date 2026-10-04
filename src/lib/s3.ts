import "server-only";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { mediaBaseUrl } from "@/lib/media";

// Stockage des médias du portfolio sur Amazon S3 (bucket S3_BUCKET, région AWS_REGION).
// Les clés (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY) sont lues par le SDK dans l'environnement :
// .env.local en local, Config Vars sur Heroku. Jamais dans le code ni dans le dépôt.

export function s3Configured() {
  return Boolean(
    process.env.S3_BUCKET && process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && mediaBaseUrl(),
  );
}

let client: S3Client | null = null;
function s3() {
  client ??= new S3Client({ region: process.env.AWS_REGION });
  return client;
}
const bucket = () => process.env.S3_BUCKET!;

// Les médias publics du portfolio sont rangés sous « portfolio/ » (dossier lisible par tous)
const key = (path: string) => `portfolio/${path.replace(/^\/+/, "")}`;
const publicUrl = (path: string) => `${mediaBaseUrl()}/${key(path)}`;
const CACHE = "public, max-age=31536000, immutable";

// Envoi direct du navigateur vers S3 : lien PUT signé, valable 10 minutes
export async function s3SignedUpload(path: string, contentType: string) {
  const url = await getSignedUrl(
    s3(),
    new PutObjectCommand({ Bucket: bucket(), Key: key(path), ContentType: contentType, CacheControl: CACHE }),
    { expiresIn: 600 },
  );
  return { uploadUrl: url, publicUrl: publicUrl(path) };
}

export async function s3Download(path: string) {
  const res = await s3().send(new GetObjectCommand({ Bucket: bucket(), Key: key(path) }));
  return new Uint8Array(await res.Body!.transformToByteArray());
}

export async function s3Upload(path: string, data: Uint8Array, contentType: string) {
  await s3().send(new PutObjectCommand({ Bucket: bucket(), Key: key(path), Body: data, ContentType: contentType, CacheControl: CACHE }));
  return publicUrl(path);
}

export async function s3Delete(path: string) {
  await s3().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key(path) }));
}

// --- Fichiers livrés aux clients : dossier privé « livrables/ » (jamais lisible publiquement) ---
// Accès uniquement par liens signés de courte durée, après les contrôles de l'espace commande.

const privateKey = (path: string) => `livrables/${path.replace(/^\/+/, "")}`;

export async function s3DeliverableUpload(path: string, contentType: string) {
  return getSignedUrl(s3(), new PutObjectCommand({ Bucket: bucket(), Key: privateKey(path), ContentType: contentType }), { expiresIn: 3600 });
}

// filename : téléchargement en pièce jointe ; sans : lecture dans la page (aperçu vidéo). Lien de 10 minutes.
export async function s3DeliverableUrl(path: string, filename?: string) {
  return getSignedUrl(
    s3(),
    new GetObjectCommand({
      Bucket: bucket(),
      Key: privateKey(path),
      ...(filename ? { ResponseContentDisposition: `attachment; filename="${filename.replace(/"/g, "")}"` } : {}),
    }),
    { expiresIn: 600 },
  );
}

export async function s3DeliverableRead(path: string) {
  const res = await s3().send(new GetObjectCommand({ Bucket: bucket(), Key: privateKey(path) }));
  return new Uint8Array(await res.Body!.transformToByteArray());
}

export async function s3DeliverableWrite(path: string, data: Uint8Array, contentType = "application/octet-stream") {
  await s3().send(new PutObjectCommand({ Bucket: bucket(), Key: privateKey(path), Body: data, ContentType: contentType }));
}

export async function s3DeliverableDelete(path: string) {
  await s3().send(new DeleteObjectCommand({ Bucket: bucket(), Key: privateKey(path) }));
}
