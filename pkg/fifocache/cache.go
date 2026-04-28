package fifocache

import (
	"container/list"
	"sync"
)

type entry[K comparable, V any] struct {
	key   K
	value V
}

type Cache[K comparable, V any] struct {
	mu       sync.RWMutex
	capacity uint
	items    map[K]*list.Element
	order    *list.List
}

func New[K comparable, V any](capacity uint) *Cache[K, V] {
	if capacity == 0 {
		capacity = 128
	}

	return &Cache[K, V]{
		capacity: capacity,
		items:    make(map[K]*list.Element, capacity),
		order:    list.New(),
	}
}

func (c *Cache[K, V]) Get(key K) (V, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	el, ok := c.items[key]
	if !ok {
		var zero V
		return zero, false
	}
	return el.Value.(*entry[K, V]).value, true
}

func (c *Cache[K, V]) Put(key K, value V) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if _, ok := c.items[key]; ok {
		return
	}

	if uint(c.order.Len()) >= c.capacity {
		oldest := c.order.Front()
		c.order.Remove(oldest)
		delete(c.items, oldest.Value.(*entry[K, V]).key)
	}

	e := &entry[K, V]{key: key, value: value}
	el := c.order.PushBack(e)
	c.items[key] = el
}

func (c *Cache[K, V]) Len() uint {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return uint(c.order.Len())
}