package worker

import (
	"context"
	"log"
	"time"

	"github.com/cinetron/media-engine/internal/queue"
	"github.com/cinetron/media-engine/internal/transcoder"
)

type Worker struct {
	queue      queue.JobQueue
	transcoder transcoder.Transcoder
}

func NewWorker(q queue.JobQueue) *Worker {
	return &Worker{
		queue:      q,
		transcoder: transcoder.NewFFmpegTranscoder(),
	}
}

func (w *Worker) Start(ctx context.Context) {
	log.Println("Worker started, waiting for jobs...")
	for {
		select {
		case <-ctx.Done():
			return
		default:
			jobID, err := w.queue.Pop(ctx)
			if err != nil {
				// Redis timeout or error, just sleep and retry
				time.Sleep(time.Second)
				continue
			}

			if jobID != "" {
				log.Printf("Processing job: %s", jobID)
				// Here we would fetch job details from DB using jobID
				// For now, we mock the processing
				w.processJob(ctx, jobID)
			}
		}
	}
}

func (w *Worker) processJob(ctx context.Context, jobID string) {
	// Simulate transcoding
	log.Printf("Transcoding started for %s", jobID)
	// err := w.transcoder.Transcode(ctx, "input.mp4", "output")
	time.Sleep(time.Second * 5) // Mock work
	log.Printf("Transcoding completed for %s", jobID)
}
