//billing/page.js
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase/client';
import styles from './Billing.module.css';
import Image from 'next/image';


import { FaLock } from 'react-icons/fa';


export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState({
    apiCalls: 0,
    storage: 0,
    planLimit: 1000,
    storageLimit: 10
  });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [activeTab, setActiveTab] = useState('usage');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState('stripe');
  const [isChineseUser, setIsChineseUser] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if user is in China (simplified for demo)
        const { data: { user } } = await supabase.auth.getUser();
        const userEmail = user?.email;
        setIsChineseUser(userEmail?.endsWith('.cn') || false);

        // Fetch subscription data (mock for this example)
        setSubscription({
          id: 'sub_123',
          status: 'active',
          plan: 'Pro',
          price: '$29/month',
          nextBillingDate: '2025-08-01',
          createdAt: '2025-01-01'
        });

        // Fetch usage data (mock)
        setUsage({
          apiCalls: 743,
          storage: 2.4,
          planLimit: 1000,
          storageLimit: 10
        });

        // Fetch payment methods (mock)
    setPaymentMethods([
  { 
    id: 'uob_1', 
    brand: 'uob', 
    name: 'UOB', 
    last4: '4242', 
    expiry: '12/25', 
    isDefault: true
  },
  { 
    id: 'paynow_1', 
    brand: 'paynow', 
    name: 'PayNow', 
    last4: '1234', 
    isDefault: false
  }
]);



        // Fetch invoices (mock)
        setInvoices([
          { id: 'inv_1', date: '2025-07-01', amount: '$29.00', status: 'paid', downloadUrl: '#' },
          { id: 'inv_2', date: '2025-06-01', amount: '$29.00', status: 'paid', downloadUrl: '#' }
        ]);

      } catch (error) {
        console.error('Error fetching billing data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

 const handleUpgrade = async (plan) => {
  try {
    // Map plan names to actual Stripe price IDs
    const priceIds = {
      basic: 'price_1RQjCJFlxr3WtdWFFG42bFX0',     // Replace with actual price ID
      pro: 'price_1RQjDjFlxr3WtdWFM4odF5LE',       // Replace with actual price ID
      enterprise: 'price_1RQjDjFlxr3WtdWFM4odF5LE' // Replace with actual price ID
    };

    const priceId = priceIds[plan.toLowerCase()];

  console.log("priceId: ", priceId);
    if (!priceId) throw new Error('Invalid plan selected');

    console.log('Sending request to:', '/api/checkout_sessions'); // Debug
    const response = await fetch('/api/checkout_sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    });

    console.log('Response status:', response.status); // Debug
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Payment failed');
    }

    const { url } = await response.json();
    console.log('Redirecting to:', url); // Debug
    window.location.href = url;
    
  } catch (error) {
    console.error('Checkout error:', error);
    alert(`Payment failed: ${error.message}`);
  }
};

  const handleAddPaymentMethod = () => {
    setShowPaymentModal(true);
  };

  const renderPaymentForm = () => {
    if (paymentProvider === 'stripe') {
      return (
        <div className={styles.paymentForm}>
          <h3>Add Credit Card (Stripe)</h3>
          <div className={styles.cardElement}>
            {/* In a real app, you would use Stripe Elements here */}
            <div className={styles.cardPreview}>
              <div className={styles.cardLogo}>
                <Image src="/stripe-logo.png" width={60} height={30} alt="Stripe" />
              </div>
              <div className={styles.cardDetails}>
                <input type="text" placeholder="Card number" className={styles.cardInput} />
                <div className={styles.cardRow}>
                  <input type="text" placeholder="MM/YY" className={styles.cardInputSmall} />
                  <input type="text" placeholder="CVC" className={styles.cardInputSmall} />
                </div>
              </div>
            </div>
          </div>
          <button className={styles.submitButton}>Add Payment Method</button>
        </div>
      );
    } else {
      return (
        <div className={styles.paymentForm}>
          <h3>中国支付 (Chinese Payment)</h3>
          <div className={styles.chinesePaymentOptions}>
            <button className={styles.paymentOption}>
              <Image src="/alipay-logo.png" width={80} height={30} alt="Alipay" />
            </button>
            <button className={styles.paymentOption}>
              <Image src="/wechat-pay-logo.png" width={80} height={30} alt="WeChat Pay" />
            </button>
            <button className={styles.paymentOption}>
              <Image src="/unionpay-logo.png" width={80} height={30} alt="UnionPay" />
            </button>
          </div>
        </div>
      );
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading billing information...</div>;
  }

  return (
    <div className={styles.billcontainer}>
      <div className={styles.header}>
        <h1>Billing & Usage</h1>
        <div className={styles.subscriptionStatus}>
          <span className={`${styles.statusBadge} ${subscription?.status === 'active' ? styles.active : ''}`}>
            {subscription?.status}
          </span>
          <span>{subscription?.plan} Plan</span>
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'usage' ? styles.active : ''}`}
          onClick={() => setActiveTab('usage')}
        >
          Usage
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'payment' ? styles.active : ''}`}
          onClick={() => setActiveTab('payment')}
        >
          Payment Methods
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'invoices' ? styles.active : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          Invoices
        </button>
      </div>

      {activeTab === 'usage' && (
        <div className={styles.usageSection}>
          <div className={styles.usageCard}>
            <h3>API Calls</h3>
            <div className={styles.progressContainer}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${(usage.apiCalls / usage.planLimit) * 100}%` }}
                ></div>
              </div>
              <div className={styles.usageStats}>
                <span>{usage.apiCalls} / {usage.planLimit} calls</span>
                <span>{Math.round((usage.apiCalls / usage.planLimit) * 100)}% used</span>
              </div>
            </div>
            <p className={styles.resetInfo}>Resets on {subscription?.nextBillingDate}</p>
          </div>

          <div className={styles.usageCard}>
            <h3>Storage</h3>
            <div className={styles.progressContainer}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${(usage.storage / usage.storageLimit) * 100}%` }}
                ></div>
              </div>
              <div className={styles.usageStats}>
                <span>{usage.storage.toFixed(1)} GB / {usage.storageLimit} GB</span>
                <span>{Math.round((usage.storage / usage.storageLimit) * 100)}% used</span>
              </div>
            </div>
          </div>

          <div className={styles.upgradeSection}>
            <h3>Upgrade Your Plan</h3>
            <div className={styles.plans}>
              <div className={styles.planCard}>
                <h4>Basic</h4>
                <p className={styles.price}>$9<span>/month</span></p>
                <ul>
                  <li>500 API calls/month</li>
                  <li>5 GB storage</li>
                  <li>Basic support</li>
                </ul>
                <button 
                  className={styles.planButton}
                  onClick={() => handleUpgrade('basic')}
                >
                  {subscription?.plan === 'Basic' ? 'Current Plan' : 'Upgrade'}
                </button>
              </div>
              <div className={`${styles.planCard} ${styles.featured}`}>
                <div className={styles.recommended}>Recommended</div>
                <h4>Pro</h4>
                <p className={styles.price}>$29<span>/month</span></p>
                <ul>
                  <li>1000 API calls/month</li>
                  <li>10 GB storage</li>
                  <li>Priority support</li>
                  <li>Advanced analytics</li>
                </ul>
                <button 
                  className={styles.planButton}
                  onClick={() => handleUpgrade('pro')}
                >
                  {subscription?.plan === 'Pro' ? 'Current Plan' : 'Upgrade'}
                </button>
              </div>
              <div className={styles.planCard}>
                <h4>Enterprise</h4>
                <p className={styles.price}>$99<span>/month</span></p>
                <ul>
                  <li>5000 API calls/month</li>
                  <li>50 GB storage</li>
                  <li>24/7 support</li>
                  <li>Dedicated account manager</li>
                </ul>
                <button 
                  className={styles.planButton}
                  onClick={() => handleUpgrade('enterprise')}
                >
                  {subscription?.plan === 'Enterprise' ? 'Current Plan' : 'Upgrade'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

 {activeTab === 'payment' && (
  <div className={styles.paymentSection}>
    <div className={styles.paymentMethods}>
      <h3>Your Payment Methods</h3>
      {paymentMethods.map((method) => (
        <div key={method.id} className={styles.paymentMethod}>
          <div className={styles.methodIcon}>
            <Image 
              src={`/${method.brand}-logo.png`} 
              width={40} 
              height={25} 
              alt={method.brand} 
            />
          </div>
          <div className={styles.methodDetails}>
            <span>{method.name} {method.last4 ? `ending in ${method.last4}` : ''}</span>
            {method.expiry && <span>Expires {method.expiry}</span>}
          </div>
          {method.isDefault && (
            <span className={styles.defaultBadge}>Default</span>
          )}
          <button 
            className={styles.disabledPayButton}
            disabled
          >
            Pay
          </button>
        </div>
      ))}
      <button 
        className={styles.disabledAddButton}
        disabled
      >
        Add Payment Method
      </button>
    </div>
  </div>
)}



      {activeTab === 'invoices' && (
        <div className={styles.invoicesSection}>
          <h3>Billing History</h3>
          <table className={styles.invoicesTable}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Download</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{invoice.date}</td>
                  <td>{invoice.amount}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${invoice.status === 'paid' ? styles.paid : ''}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td>
                    <a href={invoice.downloadUrl} className={styles.downloadLink}>
                      PDF
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showPaymentModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button 
              className={styles.modalClose}
              onClick={() => setShowPaymentModal(false)}
            >
              &times;
            </button>
            {renderPaymentForm()}
          </div>
        </div>
      )}
    </div>
  );
}