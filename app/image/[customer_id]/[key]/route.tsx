'use server';

import { NextResponse, NextRequest } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function getImageUrl(key:string) {
  'use server';

  try {
    const s3Client = new S3Client({
      endpoint: process.env.SPACE_ENDPOINT!,
      region: 'region',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    const command = new GetObjectCommand({
      Bucket: process.env.SPACE_BUCKET!,
      Key: key,
    });

    // 生成簽名網址
    const expiresInSeconds = 60 * 5;
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });

    return signedUrl;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { customer_id: string, key: string } }) {
  const { customer_id, key } = params;
  const url = await getImageUrl(`${customer_id}/${key}`);
  if (url) {
    return NextResponse.redirect(url);
  }
  return NextResponse.redirect('/404');
}
