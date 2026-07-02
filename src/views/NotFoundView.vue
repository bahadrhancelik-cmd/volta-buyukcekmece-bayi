<template>
  <main class="container empty-page">
    <h2>Sayfa bulunamadı</h2>
    <p style="color: var(--muted); margin-bottom: 24px;">Aradığınız sayfa mevcut değil.</p>
    <RouterLink to="/" class="btn btn-primary" @click="trackEvent('clickNotFoundBackToHome')">Ana sayfaya dön</RouterLink>
  </main>
</template>

<script setup>
import { trackEvent } from '../lib/analytics';
</script>
