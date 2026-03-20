"""
Database models for ShopSec-AI
SQLAlchemy ORM models with pgvector support
"""
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
try:
    from pgvector.sqlalchemy import Vector
except ImportError:
    # Fallback for Lite Mode (SQLite)
    from sqlalchemy import JSON
    Vector = lambda x: JSON

Base = declarative_base()

class Product(Base):
    """Product catalog"""
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(100), index=True)
    price = Column(Float, nullable=False)
    cost = Column(Float)  # Wholesale cost (for profit margin checks)
    stock = Column(Integer, default=0)
    image_url = Column(String(500))
    is_digital = Column(Boolean, default=False)
    is_refundable = Column(Boolean, default=True)
    max_discount_percent = Column(Float, default=15.0)
    
    # Vector embedding for semantic search
    embedding = Column(Vector(384))  # MiniLM produces 384-dim vectors
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    reviews = relationship("Review", back_populates="product")
    order_items = relationship("OrderItem", back_populates="product")

class User(Base):
    """User accounts"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_admin = Column(Boolean, default=False)
    
    # Profile
    first_name = Column(String(100))
    last_name = Column(String(100))
    address = Column(Text)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)
    
    # Relationships
    orders = relationship("Order", back_populates="user")
    reviews = relationship("Review", back_populates="user")
    cart_items = relationship("CartItem", back_populates="user")

class Order(Base):
    """Customer orders"""
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Order details
    status = Column(String(50), default="pending")  # pending, paid, shipped, delivered, refunded
    total_amount = Column(Float, nullable=False)
    discount_amount = Column(Float, default=0.0)
    final_amount = Column(Float, nullable=False)
    
    # Payment
    payment_method = Column(String(50))
    payment_id = Column(String(255))
    
    # Shipping
    shipping_address = Column(Text)
    tracking_number = Column(String(100))
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    """Items within an order"""
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)  # Price at time of purchase
    discount_applied = Column(Float, default=0.0)
    
    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")

class CartItem(Base):
    """Shopping cart items"""
    __tablename__ = "cart_items"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    quantity = Column(Integer, nullable=False, default=1)
    added_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="cart_items")
    product = relationship("Product")

class Review(Base):
    """Product reviews - ATTACK SURFACE for RAG poisoning"""
    __tablename__ = "reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    rating = Column(Integer, nullable=False)  # 1-5 stars
    title = Column(String(255))
    content = Column(Text, nullable=False)
    
    # Vector embedding for semantic search
    embedding = Column(Vector(384))
    
    # Moderation
    is_verified_purchase = Column(Boolean, default=False)
    is_flagged = Column(Boolean, default=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    helpful_count = Column(Integer, default=0)
    
    # Relationships
    product = relationship("Product", back_populates="reviews")
    user = relationship("User", back_populates="reviews")

class AgentInteraction(Base):
    """Log of all agent interactions - for monitoring and CTF"""
    __tablename__ = "agent_interactions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(255), index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Interaction details
    agent_type = Column(String(50))  # dealmaker, support, search
    user_message = Column(Text, nullable=False)
    agent_response = Column(Text, nullable=False)
    
    # Thought chain (for debugging/exploitation)
    thought_chain = Column(JSON)  # VULNERABILITY: Exposes reasoning
    tool_calls = Column(JSON)  # Tools invoked by agent
    
    # Context
    context_used = Column(JSON)  # RAG context provided
    
    # Flags
    is_suspicious = Column(Boolean, default=False)
    anomaly_score = Column(Float, default=0.0)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    duration_ms = Column(Integer)

class PriceNegotiation(Base):
    """Track price negotiation attempts"""
    __tablename__ = "price_negotiations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    original_price = Column(Float, nullable=False)
    offered_price = Column(Float)
    final_price = Column(Float)
    
    discount_percent = Column(Float)
    was_accepted = Column(Boolean, default=False)
    
    # Conversation
    messages = Column(JSON)  # Full negotiation transcript
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)

class Flag(Base):
    """CTF flags hidden throughout the system"""
    __tablename__ = "flags"
    
    id = Column(Integer, primary_key=True, index=True)
    flag_id = Column(String(50), unique=True, nullable=False)
    flag_value = Column(String(255), nullable=False)
    
    # Challenge details
    challenge_name = Column(String(255))
    difficulty = Column(String(20))  # easy, medium, hard
    hint = Column(Text)
    
    # Location
    location_type = Column(String(50))  # product, review, agent_response, database
    location_id = Column(String(255))
    
    # Tracking
    is_found = Column(Boolean, default=False)
    found_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    found_at = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.utcnow)
