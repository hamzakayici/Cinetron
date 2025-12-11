package queue

import (
	"context"
	"github.com/redis/go-redis/v9"
	"time"
)

type JobQueue interface {
	Pop(ctx context.Context) (string, error)
}

type RedisQueue struct {
	client *redis.Client
	stream string
	group  string
}

func NewRedisClient(addr, password string, db int) *RedisQueue {
	rdb := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       db,
	})

	return &RedisQueue{
		client: rdb,
		stream: "transcode_jobs",
		group:  "media_engine_group",
	}
}

// Pop blocks until a message is available in the stream
func (q *RedisQueue) Pop(ctx context.Context) (string, error) {
	// Ensure group exists
	err := q.client.XGroupCreateMkStream(ctx, q.stream, q.group, "$").Err()
	if err != nil && err.Error() != "BUSYGROUP Consumer Group name already exists" {
		// Log error but continue if it's just that the group exists
	}

	streams, err := q.client.XReadGroup(ctx, &redis.XReadGroupArgs{
		Group:    q.group,
		Consumer: "worker-1", // Should be unique per pod
		Streams:  []string{q.stream, ">"},
		Count:    1,
		Block:    time.Second * 5,
	}).Result()

	if err != nil {
		return "", err
	}

	if len(streams) > 0 && len(streams[0].Messages) > 0 {
		msg := streams[0].Messages[0]
		// Acknowledge the message immediately for simplicity in this demo
		q.client.XAck(ctx, q.stream, q.group, msg.ID)
		
		// Assuming the job payload is in "jobID" key for now
		val, ok := msg.Values["jobID"].(string) 
		if ok {
			return val, nil
		}
	}

	return "", nil
}
