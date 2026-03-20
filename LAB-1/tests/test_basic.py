"""
MedAssist AI - Basic Test Suite
Smoke tests to verify lab functionality
"""

import pytest
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


class TestEnvironment:
    """Test environment setup"""

    def test_python_version(self):
        """Verify Python version is 3.10+"""
        assert sys.version_info >= (3, 10), "Python 3.10+ required"

    def test_env_file_exists(self):
        """Verify .env file exists"""
        env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
        assert os.path.exists(env_path) or os.path.exists(env_path + '.example'), \
            ".env or .env.example must exist"


class TestImports:
    """Test critical imports"""

    def test_import_flask(self):
        """Test Flask import"""
        try:
            import flask
            assert True
        except ImportError:
            pytest.fail("Flask not installed")

    def test_import_openai(self):
        """Test OpenAI import"""
        try:
            import openai
            assert True
        except ImportError:
            pytest.fail("OpenAI not installed")

    def test_import_sqlalchemy(self):
        """Test SQLAlchemy import"""
        try:
            import sqlalchemy
            assert True
        except ImportError:
            pytest.fail("SQLAlchemy not installed")


class TestConfig:
    """Test configuration"""

    def test_config_loads(self):
        """Test config module loads"""
        try:
            import config
            assert hasattr(config, 'Config')
        except Exception as e:
            pytest.fail(f"Config failed to load: {e}")

    def test_system_prompts_exist(self):
        """Test system prompts are defined"""
        from config import SYSTEM_PROMPTS

        required_agents = ['orchestrator', 'intake_agent', 'records_agent',
                          'appointment_agent', 'billing_agent']

        for agent in required_agents:
            assert agent in SYSTEM_PROMPTS, f"System prompt for {agent} missing"
            assert len(SYSTEM_PROMPTS[agent]) > 0, f"{agent} prompt is empty"


class TestDatabase:
    """Test database setup"""

    def test_database_exists(self):
        """Test database file exists"""
        db_path = os.path.join(os.path.dirname(__file__), '..', 'database', 'medassist.db')
        assert os.path.exists(db_path), "Database not initialized"

    def test_database_tables(self):
        """Test required tables exist"""
        import sqlite3

        db_path = os.path.join(os.path.dirname(__file__), '..', 'database', 'medassist.db')
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Check for required tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]

        required_tables = ['users', 'patients', 'medical_records',
                          'appointments', 'billing']

        for table in required_tables:
            assert table in tables, f"Table '{table}' missing from database"

        conn.close()

    def test_default_users_exist(self):
        """Test default users are created"""
        import sqlite3

        db_path = os.path.join(os.path.dirname(__file__), '..', 'database', 'medassist.db')
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]

        assert user_count >= 4, f"Expected at least 4 default users, found {user_count}"

        conn.close()


class TestAgents:
    """Test agent modules"""

    def test_base_agent_imports(self):
        """Test base agent can be imported"""
        try:
            from agents.base_agent import BaseAgent
            assert True
        except Exception as e:
            pytest.fail(f"Failed to import BaseAgent: {e}")

    def test_orchestrator_imports(self):
        """Test orchestrator can be imported"""
        try:
            from agents.orchestrator import OrchestratorAgent
            assert True
        except Exception as e:
            pytest.fail(f"Failed to import OrchestratorAgent: {e}")


class TestVulnerabilities:
    """Test that intentional vulnerabilities are present (for lab purposes)"""

    def test_sql_injection_vulnerable(self):
        """Verify SQL injection vulnerability exists in login"""
        with open(os.path.join(os.path.dirname(__file__), '..', 'app.py'), 'r') as f:
            content = f.read()
            # Should have vulnerable SQL query
            assert "f\"SELECT * FROM users WHERE username='{username}'" in content, \
                "SQL injection vulnerability missing (required for lab)"

    def test_admin_endpoint_exists(self):
        """Verify dangerous admin endpoint exists"""
        with open(os.path.join(os.path.dirname(__file__), '..', 'app.py'), 'r') as f:
            content = f.read()
            assert '/api/admin/execute' in content, \
                "Admin execute endpoint missing (required for lab)"

    def test_rag_upload_vulnerable(self):
        """Verify RAG upload allows poisoning"""
        with open(os.path.join(os.path.dirname(__file__), '..', 'app.py'), 'r') as f:
            content = f.read()
            assert '/api/rag/upload' in content, \
                "RAG upload endpoint missing (required for lab)"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
