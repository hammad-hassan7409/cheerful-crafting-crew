import { createFileRoute } from '@tanstack/react-router'
import { supabaseAdmin } from '@/integrations/supabase/client.server'

export const Route = createFileRoute('/api/public/setup-storage')({
  server: {
    handlers: {
      GET: async () => {
        try {
          // Use supabaseAdmin (service role) to bypass RLS and create/fix the bucket
          console.log('[Setup] Attempting to fix product-media bucket...');
          
          // 1. Try to create the bucket
          const { data: createData, error: createError } = await supabaseAdmin.storage.createBucket('product-media', {
            public: true,
            fileSizeLimit: 104857600 // 100MB
          });
          
          if (createError && createError.message !== 'Bucket already exists') {
            console.error('[Setup] Create error:', createError);
            return new Response(JSON.stringify({ success: false, error: createError.message }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          // 2. Ensure it's public even if it existed
          await supabaseAdmin.storage.updateBucket('product-media', {
            public: true
          });

          console.log('[Setup] Bucket fixed successfully');
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'Bucket product-media is now ready and public.',
            created: !createError 
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (err: any) {
          console.error('[Setup] Unexpected error:', err);
          return new Response(JSON.stringify({ success: false, error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    }
  }
})
