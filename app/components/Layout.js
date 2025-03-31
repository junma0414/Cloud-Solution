import Head from 'next/head'

export default function Layout({ children }) {
  return (
    <>
      <Head>
        <title>Your Site Title</title>
        {/* Other head elements */}
      </Head>
      <main>{children}</main>
      <footer style={{
        padding: '10px',
        textAlign: 'center',
        backgroundColor: '#f0f0f0',
        position: 'fixed',
        bottom: '0',
        width: '100%',
       Height: '40px'
      }}>
        © {new Date().getFullYear()} Obserpedia
      </footer>
    </>
  )
}