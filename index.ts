import * as aws from "@pulumi/aws";

// Create an S3 bucket for the static website
const bucket = new aws.s3.Bucket("my-static-website-bucket", {
    website: {
        indexDocument: "index.html",
    },
    forceDestroy: true,
});

// Disable Block Public Access (separate resource for compatibility)
const bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock("bucketPublicAccessBlock", {
    bucket: bucket.id,
    blockPublicAcls: false,
    blockPublicPolicy: false,
    ignorePublicAcls: false,
    restrictPublicBuckets: false,
});

// Upload a sample index.html file
const indexObject = new aws.s3.BucketObject("index.html", {
    bucket: bucket,
    content: `<h1>Hello, Patel Pulumi Lab 7!</h1>`,
    contentType: "text/html",
});

// Set bucket policy to allow public read access
const bucketPolicy = new aws.s3.BucketPolicy("bucketPolicy", {
    bucket: bucket.bucket,
    policy: bucket.bucket.apply(bucketName => JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Principal: "*",
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${bucketName}/*`],
        }],
    })),
});

// Create a CloudFront distribution
const cdn = new aws.cloudfront.Distribution("cdn", {
    enabled: true,
    origins: [{
        domainName: bucket.bucketRegionalDomainName,
        originId: bucket.arn,
    }],
    defaultRootObject: "index.html",
    defaultCacheBehavior: {
        targetOriginId: bucket.arn,
        viewerProtocolPolicy: "redirect-to-https",
        allowedMethods: ["GET", "HEAD", "OPTIONS"],
        cachedMethods: ["GET", "HEAD", "OPTIONS"],
        forwardedValues: {
            queryString: false,
            cookies: { forward: "none" },
        },
        minTtl: 0,
        defaultTtl: 86400,
        maxTtl: 31536000,
    },
    priceClass: "PriceClass_100",
    viewerCertificate: {
        cloudfrontDefaultCertificate: true,
    },
    restrictions: {
        geoRestriction: {
            restrictionType: "none",
        },
    },
});

// Export the bucket name and CloudFront URL
export const bucketName = bucket.bucket;
export const websiteUrl = cdn.domainName;