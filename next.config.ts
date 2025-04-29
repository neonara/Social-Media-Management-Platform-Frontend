module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `img-src 'self' data: http://localhost:8000`,
          },
        ],
      },
      
    ];
  },
};