package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/cinetron/media-engine/internal/queue"
	"github.com/cinetron/media-engine/internal/worker"
)

func main() {
	log.Println("Starting Cinetron Media Engine...")

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Initialize Redis
	redisClient := queue.NewRedisClient("localhost:6379", "", 0) // TODO: Load from env
	
	// Initialize Worker
	w := worker.NewWorker(redisClient)

	// Start Worker
	go w.Start(ctx)

	// Graceful Shutdown
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	log.Println("Shutting down...")
}
