package services

import (
	"context"
	"io"
	"time"

	awsConfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"

	"github.com/jos3lo89/library-api/config"
)

type S3Service struct {
	client  *s3.Client
	presign *s3.PresignClient
	bucket  string
}

func NewS3Service(cfg *config.Config) (*S3Service, error) {
	awsCfg, err := awsConfig.LoadDefaultConfig(
		context.Background(),
		awsConfig.WithRegion(cfg.AWSRegion),
		awsConfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(cfg.AWSAccessKey, cfg.AWSSecretKey, "")),
	)
	if err != nil {
		return nil, err
	}

	client := s3.NewFromConfig(awsCfg)
	presignClient := s3.NewPresignClient(client)

	return &S3Service{
		client:  client,
		presign: presignClient,
		bucket:  cfg.AWSBucket,
	}, nil
}

func (s *S3Service) Upload(ctx context.Context, key string, body io.Reader, contentType string) error {
	_, err := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      &s.bucket,
		Key:         &key,
		Body:        body,
		ContentType: &contentType,
	})
	return err
}

func (s *S3Service) PresignGetURL(ctx context.Context, key string, expires time.Duration) (string, error) {
	input := &s3.GetObjectInput{
		Bucket: &s.bucket,
		Key:    &key,
	}

	result, err := s.presign.PresignGetObject(ctx, input, s3.WithPresignExpires(expires))
	if err != nil {
		return "", err
	}

	return result.URL, nil
}
